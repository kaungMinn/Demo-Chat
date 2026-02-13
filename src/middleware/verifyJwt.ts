import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        displayName: string;
        roles: number[];
      };
    }
  }
}

// Extend JwtPayload to include userInfo
interface CustomJwtPayload extends JwtPayload {
  userInfo: {
    _id: string;
    displayName: string;
    roles: number[];
  };
}

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization as string;

    if (!authHeader?.startsWith("Bearer")){
        res.sendStatus(StatusCodes.UNAUTHORIZED);
        return;
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
      if (err) return res.sendStatus(StatusCodes.FORBIDDEN);
      
      // Attach user info to request object
      const payload = decoded as CustomJwtPayload;
      req.user = payload.userInfo;
      next();
    });

}