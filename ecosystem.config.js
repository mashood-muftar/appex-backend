module.exports = {
  apps: [{
    name: "apex-biotics-api",
    script: "app.js",
    exec_mode: "cluster",
    instances: "max", // Use max for auto-detection based on CPU cores
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    merge_logs: true,
    out_file: "./logs/pm2-out.log",
    error_file: "./logs/pm2-error.log"
  }],
  
  // Configure PM2 logrotate module
  // Note: You should still run `pm2 install pm2-logrotate` separately
  module_conf: {
    "pm2-logrotate": {
      rotate_interval: "0 0 * * *", // Rotate at midnight every day
      max_size: "10M",
      retain: "14", // Keep logs for 14 days
      compress: true,
      dateFormat: "YYYY-MM-DD_HH-mm-ss",
      workerInterval: "30",
      rotateModule: true
    }
  }
}; 