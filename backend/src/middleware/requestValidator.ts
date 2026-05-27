import { Request, Response, NextFunction } from 'express';

export const validateAmount = (req: Request, res: Response, next: NextFunction) => {
  const amount = req.body.amount || req.query.amount;
  if (amount !== undefined) {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
  }
  next();
};

export const validateDate = (req: Request, res: Response, next: NextFunction) => {
  const date = req.body.date || req.query.date;
  if (date && isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  next();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({ error: 'Limit must be between 1 and 100' });
  }

  req.query.page = pageNum.toString();
  req.query.limit = limitNum.toString();
  next();
};

export const validateCategoryType = (type: string): boolean => {
  return ['fixed', 'variable', 'recurring'].includes(type);
};

export const validateBudgetingMethod = (method: string): boolean => {
  return ['zero-based', 'flex', 'hybrid'].includes(method);
};
