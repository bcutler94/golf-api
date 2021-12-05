import logger from 'bunyan';

export default logger.createLogger({ 
  name: 'golf-api',
  serializers: {
    req: ([req, rep]) => {
      return {
        method: req.method,
        url: req.url,
        replyTime: rep.getResponseTime(),
        headers: req.headers
      };
    }
  }
})

