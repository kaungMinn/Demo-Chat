import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

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

export const mockVerifyJWT = (req: Request, res: Response, next: NextFunction) => {
    // In test environment, parse user from custom header
    if (process.env.NODE_ENV === 'test') {
        const userHeader = req.headers.user as string;
        if (userHeader) {
            try {
                req.user = JSON.parse(userHeader);
                next();
                return;
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid user header format' });
                return;
            }
        }
    }
    
    // For non-test environments, this shouldn't be used
    res.sendStatus(StatusCodes.UNAUTHORIZED);
};
