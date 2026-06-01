#!/bin/bash

echo "===================================="
echo "BETA TEST FLOW VALIDATION"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_URL="http://localhost:3001/api"
TEST_EMAIL="betauser_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"
TEST_FIRST_NAME="Beta"
TEST_LAST_NAME="Tester"

echo -e "\n${YELLOW}[TEST 1] Checking Backend Health${NC}"
curl -s "$BACKEND_URL/../health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend is running${NC}"
else
  echo -e "${RED}✗ Backend is NOT running - Start backend first!${NC}"
  echo "  Run: cd backend && npm start"
  exit 1
fi

echo -e "\n${YELLOW}[TEST 2] Testing Signup Endpoint${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"country\": \"US\"
  }")

echo "Response:"
echo "$SIGNUP_RESPONSE" | jq .

# Extract token and user ID from response
USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id // empty')
TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token // empty')
MESSAGE=$(echo "$SIGNUP_RESPONSE" | jq -r '.message // empty')

if [ -z "$USER_ID" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Signup failed - no token or user ID${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Signup successful${NC}"
echo "  User ID: $USER_ID"
echo "  Token: ${TOKEN:0:20}..."
echo "  Message: $MESSAGE"

echo -e "\n${YELLOW}[TEST 3] Testing Protected Route with Token${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile Response:"
echo "$PROFILE_RESPONSE" | jq .

USER_EMAIL=$(echo "$PROFILE_RESPONSE" | jq -r '.email // empty')
if [ "$USER_EMAIL" == "$TEST_EMAIL" ]; then
  echo -e "${GREEN}✓ Protected route works with token${NC}"
else
  echo -e "${RED}✗ Protected route failed${NC}"
fi

echo -e "\n${YELLOW}[TEST 4] Testing Login with New Account${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq .

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
if [ -n "$LOGIN_TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
else
  echo -e "${RED}✗ Login failed${NC}"
fi

echo -e "\n${YELLOW}[TEST 5] Testing Dashboard Data Access${NC}"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BACKEND_URL/budgets/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Dashboard Response:"
echo "$DASHBOARD_RESPONSE" | jq . | head -20

echo -e "\n${GREEN}===================================="
echo "TEST FLOW COMPLETE"
echo "====================================${NC}"

