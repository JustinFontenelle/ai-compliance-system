function logAuditEvent(type, details, requestId, clientIp) {

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId: requestId,
    ip: clientIp,
    event: type,
    details
  }));

}

module.exports = logAuditEvent;