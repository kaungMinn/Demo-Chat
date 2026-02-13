import { NextFunction, Request, Response } from "express";
import { dataUtils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";
import { userConstants } from "../constants/userConstants";

export const isAdmin = (req:Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if(!user?.roles?.includes(userConstants.ADMIN)){
        return res.sendStatus(StatusCodes.FORBIDDEN);
    }

    console.log("user", user.roles.includes(userConstants.ADMIN));

    next();
}