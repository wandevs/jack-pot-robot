module.exports = {
  "appenders": {
    "access": {
      "type": "dateFile",
      "filename": __dirname + "/../log/access.log",
      "pattern": "-yyyy-MM-dd",
      "category": "http"
    },
    "console": {
      "type": "console"
    },
    "app": {
      "type": "file",
      "filename": __dirname + "/../log/app.log",
      "maxLogSize": 10485760,
      "numBackups": 3
    },
    "errorFile": {
      "type": "file",
      "filename": __dirname + "/../log/errors.log"
    },
    "errors": {
      "type": "logLevelFilter",
      "level": "ERROR",
      "appender": "errorFile"
    }
  },
  "categories": {
    "default": { "appenders": [ "console", "app", "errors" ], "level": "DEBUG" },
    "http": { "appenders": [ "access"], "level": "DEBUG" }
  }
}
