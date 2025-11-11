#!/bin/bash
cd /var/www/journal.aligru.com/app
npm run build
chown -R ubuntu:www-data ../htdocs/
echo "Built and deployed!"