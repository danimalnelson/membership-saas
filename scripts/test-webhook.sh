#!/bin/bash

# Test webhook by triggering events with Stripe CLI
echo "🧪 Testing Stripe Webhooks"
echo ""
echo "This will trigger test events to your production webhook endpoint:"
echo "https://membership-saas-web.vercel.app/api/stripe/webhook"
echo ""

# Make sure we're logged in
echo "1️⃣ Checking Stripe CLI login..."
stripe config --list | grep account_id || {
  echo "❌ Not logged in. Run: stripe login"
  exit 1
}
echo "✅ Logged in"
echo ""

# Trigger checkout.session.completed
echo "2️⃣ Triggering checkout.session.completed event..."
stripe trigger checkout.session.completed

echo ""
echo "✅ Event triggered!"
echo ""
echo "3️⃣ Check if webhook received the event:"
echo "   https://membership-saas-web.vercel.app/api/debug/webhook-test"
echo ""
echo "   You should see totalWebhookEvents > 0"
echo ""

