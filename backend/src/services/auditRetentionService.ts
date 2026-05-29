import { pool } from '../config/database';

/**
 * Audit Retention Service
 * Manages lifecycle of audit logs: active storage → archival → deletion
 * Implements retention policies for compliance and storage optimization
 */

export interface RetentionPolicy {
  id: number;
  organization_id: number;
  active_days: number;
  archive_days: number;
  auto_delete: boolean;
  export_format: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageUsage {
  activeBytes: number;
  archiveBytes: number;
  totalBytes: number;
  retentionDaysActive: number;
  retentionDaysArchive: number;
  logCountActive: number;
  logCountArchive: number;
}

/**
 * Get retention policy for an organization
 * Returns defaults if policy doesn't exist yet
 */
export async function getAuditRetentionPolicy(
  organizationId: number
): Promise<RetentionPolicy> {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_retention_policies
       WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      // Return default policy
      return {
        id: 0,
        organization_id: organizationId,
        active_days: 90,
        archive_days: 365,
        auto_delete: true,
        export_format: 'json',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching retention policy:', error);
    throw new Error('Failed to fetch retention policy');
  }
}

/**
 * Archive audit logs older than specified date
 * Moves logs from audit_logs to audit_log_archives
 */
export async function archiveAuditLogs(
  beforeDate: Date,
  organizationId?: number
): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get logs to archive
    const selectResult = await client.query(
      `SELECT id, user_id, action, resource_type, resource_id, description,
              ip_address, user_agent, status, error_message, changes,
              before_values, after_values, request_id, created_at
       FROM audit_logs
       WHERE organization_id = $1 AND created_at < $2
       ORDER BY created_at ASC`,
      [organizationId || null, beforeDate]
    );

    if (selectResult.rows.length === 0) {
      await client.query('COMMIT');
      return 0;
    }

    const archiveDate = new Date(beforeDate);
    archiveDate.setDate(archiveDate.getDate() - 1);

    // Insert archive record with JSONB array
    await client.query(
      `INSERT INTO audit_log_archives
       (organization_id, archive_date, log_count, archive_size_bytes, logs_data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        organizationId,
        archiveDate.toISOString().split('T')[0],
        selectResult.rows.length,
        JSON.stringify(selectResult.rows).length * 2, // Approximate bytes
        JSON.stringify(selectResult.rows),
      ]
    );

    // Delete archived logs
    const deleteResult = await client.query(
      `DELETE FROM audit_logs
       WHERE organization_id = $1 AND created_at < $2`,
      [organizationId || null, beforeDate]
    );

    await client.query('COMMIT');

    console.log(
      `Archived ${selectResult.rows.length} audit logs for org ${organizationId}`
    );
    return selectResult.rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error archiving audit logs:', error);
    throw new Error('Failed to archive audit logs');
  } finally {
    client.release();
  }
}

/**
 * Delete archived logs older than retention policy
 * Permanently removes archived logs past retention period
 */
export async function deleteArchivedLogs(
  beforeDate: Date,
  organizationId?: number
): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM audit_log_archives
       WHERE organization_id = $1 AND created_at < $2`,
      [organizationId, beforeDate]
    );

    console.log(
      `Deleted ${result.rowCount} archived audit logs for org ${organizationId}`
    );
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error deleting archived logs:', error);
    throw new Error('Failed to delete archived logs');
  }
}

/**
 * Get storage usage for audit logs
 * Returns size and count of both active and archived logs
 */
export async function getAuditStorageUsage(
  organizationId: number
): Promise<StorageUsage> {
  try {
    // Get active logs
    const activeResult = await pool.query(
      `SELECT COUNT(*) as count,
              COALESCE(SUM(OCTET_LENGTH(changes::text) + OCTET_LENGTH(before_values::text) + OCTET_LENGTH(after_values::text)), 0) as size_bytes
       FROM audit_logs
       WHERE organization_id = $1`,
      [organizationId]
    );

    // Get archived logs
    const archiveResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(archive_size_bytes), 0) as size_bytes
       FROM audit_log_archives
       WHERE organization_id = $1`,
      [organizationId]
    );

    const policy = await getAuditRetentionPolicy(organizationId);

    return {
      activeBytes: parseInt(activeResult.rows[0].size_bytes || 0),
      archiveBytes: parseInt(archiveResult.rows[0].size_bytes || 0),
      totalBytes:
        parseInt(activeResult.rows[0].size_bytes || 0) +
        parseInt(archiveResult.rows[0].size_bytes || 0),
      retentionDaysActive: policy.active_days,
      retentionDaysArchive: policy.archive_days,
      logCountActive: parseInt(activeResult.rows[0].count || 0),
      logCountArchive: parseInt(archiveResult.rows[0].count || 0),
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    throw new Error('Failed to calculate storage usage');
  }
}

/**
 * Export audit logs as JSON or CSV
 * Includes both active and archived logs
 */
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json',
  organizationId?: number
): Promise<string> {
  try {
    // Get active logs
    const activeResult = await pool.query(
      `SELECT id, user_id, action, resource_type, resource_id, description,
              ip_address, user_agent, status, error_message, changes,
              before_values, after_values, request_id, created_at
       FROM audit_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
       ORDER BY created_at DESC`,
      [organizationId, startDate, endDate]
    );

    // Get archived logs (extract from JSONB arrays)
    const archiveResult = await pool.query(
      `SELECT logs_data
       FROM audit_log_archives
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
       ORDER BY created_at DESC`,
      [organizationId, startDate, endDate]
    );

    // Combine all logs
    const allLogs = activeResult.rows;
    for (const archive of archiveResult.rows) {
      if (archive.logs_data && Array.isArray(archive.logs_data)) {
        allLogs.push(...archive.logs_data);
      }
    }

    if (format === 'csv') {
      return convertLogsToCSV(allLogs);
    } else {
      return JSON.stringify(allLogs, null, 2);
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw new Error('Failed to export audit logs');
  }
}

/**
 * Convert audit logs to CSV format
 */
function convertLogsToCSV(logs: any[]): string {
  const headers = [
    'ID',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'Status',
    'IP Address',
    'Created At',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.user_id || '',
    log.action,
    log.resource_type,
    log.resource_id || '',
    log.status,
    log.ip_address || '',
    log.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell
        )
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Update retention policy for organization
 */
export async function updateRetentionPolicy(
  policy: Partial<RetentionPolicy>,
  organizationId?: number
): Promise<RetentionPolicy> {
  try {
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (policy.active_days !== undefined) {
      updateFields.push(`active_days = $${paramCount}`);
      updateValues.push(policy.active_days);
      paramCount++;
    }

    if (policy.archive_days !== undefined) {
      updateFields.push(`archive_days = $${paramCount}`);
      updateValues.push(policy.archive_days);
      paramCount++;
    }

    if (policy.auto_delete !== undefined) {
      updateFields.push(`auto_delete = $${paramCount}`);
      updateValues.push(policy.auto_delete);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return await getAuditRetentionPolicy(organizationId);
    }

    updateValues.push(organizationId);

    const result = await pool.query(
      `UPDATE audit_retention_policies
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE organization_id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      // Create default policy if doesn't exist
      return await createRetentionPolicy(organizationId, policy);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating retention policy:', error);
    throw new Error('Failed to update retention policy');
  }
}

/**
 * Create retention policy for organization
 */
async function createRetentionPolicy(
  organizationId?: number,
  policy?: Partial<RetentionPolicy>
): Promise<RetentionPolicy> {
  try {
    const result = await pool.query(
      `INSERT INTO audit_retention_policies
       (organization_id, active_days, archive_days, auto_delete, export_format, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        organizationId,
        policy?.active_days || 90,
        policy?.archive_days || 365,
        policy?.auto_delete !== undefined ? policy.auto_delete : true,
        policy?.export_format || 'json',
        true,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating retention policy:', error);
    throw new Error('Failed to create retention policy');
  }
}

/**
 * Cleanup expired audit logs (called by scheduler)
 * Archives logs older than active_days, deletes logs older than archive_days
 */
export async function cleanupAuditLogs(): Promise<{
  archivedCount: number;
  deletedCount: number;
}> {
  try {
    // Get all organizations with retention policies
    const orgsResult = await pool.query(
      `SELECT o.id, arp.active_days, arp.archive_days, arp.auto_delete
       FROM organizations o
       LEFT JOIN audit_retention_policies arp ON o.id = arp.organization_id
       WHERE arp.is_active = true OR arp.id IS NULL`
    );

    let totalArchived = 0;
    let totalDeleted = 0;

    for (const org of orgsResult.rows) {
      const activeDaysAgo = new Date();
      activeDaysAgo.setDate(
        activeDaysAgo.getDate() - (org.active_days || 90)
      );

      const archiveDaysAgo = new Date();
      archiveDaysAgo.setDate(
        archiveDaysAgo.getDate() - (org.archive_days || 365)
      );

      // Archive logs
      const archivedCount = await archiveAuditLogs(activeDaysAgo, org.id);
      totalArchived += archivedCount;

      // Delete archived logs
      if (org.auto_delete) {
        const deletedCount = await deleteArchivedLogs(archiveDaysAgo, org.id);
        totalDeleted += deletedCount;
      }
    }

    console.log(
      `Cleanup complete: Archived ${totalArchived}, Deleted ${totalDeleted}`
    );

    return {
      archivedCount: totalArchived,
      deletedCount: totalDeleted,
    };
  } catch (error) {
    console.error('Error during audit log cleanup:', error);
    throw new Error('Audit log cleanup failed');
  }
}
