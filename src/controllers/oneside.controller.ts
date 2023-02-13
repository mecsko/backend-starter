import { Request, Response, Router } from "express";
import onesideModel from "./oneside.model";
import type Controller from "../interfaces/controller.interface";

export default class nsideController implements Controller {
    public router = Router();
    private onesideM = onesideModel;

    constructor() {
        this.router.get("/api/xyz1", this.getAll);
    }

    private getAll = async (_req: Request, res: Response) => {
        try {
            const data = await this.onesideM.find().populate("virtualPop").lean().exec();
            res.send(data);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };
}
