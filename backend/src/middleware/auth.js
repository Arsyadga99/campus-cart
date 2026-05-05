import jwt from 'jsonwebtoken';

function getTokenFromHeader(header) {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

export function authenticateToken(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token.' });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }

    return next();
  };
}
