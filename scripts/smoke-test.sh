#!/bin/bash
set -e

# Post-deployment smoke tests
# Run this after every deployment to verify critical functionality

DEPLOYMENT_URL="${1:-https://membership-saas-pt5b7oinl-dannelson.vercel.app}"

echo "🧪 Running smoke tests against: $DEPLOYMENT_URL"
echo ""

# Test 1: Health check
echo "✓ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "$DEPLOYMENT_URL/api/health")
if [ "$HEALTH_RESPONSE" != "200" ]; then
  echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
  cat /tmp/health.json
  exit 1
fi
echo "  ✅ Health check passed"

# Test 2: Sign-in page loads
echo "✓ Testing sign-in page..."
SIGNIN_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DEPLOYMENT_URL/auth/signin")
if [ "$SIGNIN_RESPONSE" != "200" ]; then
  echo "❌ Sign-in page failed (HTTP $SIGNIN_RESPONSE)"
  exit 1
fi
echo "  ✅ Sign-in page loads"

# Test 3: API route responds
echo "✓ Testing API routes..."
API_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DEPLOYMENT_URL/api/health")
if [ "$API_RESPONSE" != "200" ]; then
  echo "❌ API routes failed (HTTP $API_RESPONSE)"
  exit 1
fi
echo "  ✅ API routes working"

# Test 4: Static assets load
echo "✓ Testing static assets..."
STATIC_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DEPLOYMENT_URL/")
if [ "$STATIC_RESPONSE" != "200" ]; then
  echo "❌ Static assets failed (HTTP $STATIC_RESPONSE)"
  exit 1
fi
echo "  ✅ Static assets load"

echo ""
echo "🎉 All smoke tests passed!"
echo ""
echo "Health check details:"
cat /tmp/health.json | python3 -m json.tool

