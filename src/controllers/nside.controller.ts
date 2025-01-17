import { Request, Response, Router } from "express";
import nsideModel from "./nside.model";
import type Controller from "../interfaces/controller.interface";
import type { INSide } from "interfaces/nside";

export default class nsideController implements Controller {
    public router = Router();
    private nsideM = nsideModel;

    constructor() {
        this.router.get("/api/xyzN", this.getAll);
        this.router.get("/api/xyzN/:id", this.getById);
        this.router.get("/api/xyzN/keyword/:keyword", this.getByKeyword);
        this.router.get(`/api/xyzN/:offset/:limit/:sortingfield/:ascdesc/:filter?`, this.getPaginatedData);
        this.router.post("/api/xyzN", this.create);
        this.router.patch("/api/xyzN/:id", this.modifyPATCH);
        this.router.put("/api/xyzN/:id", this.modifyPUT);
        this.router.delete("/api/xyzN/:id", this.delete);
    }

    private getAll = async (_req: Request, res: Response) => {
        try {
            const data = await this.nsideM.find().populate("FK_neve").lean().exec();
            // or:
            // const data = await this.nsideM.find().populate("virtualPop");
            res.send(data);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private getById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = req.params["id"];
            const document = await this.nsideM.findById(id).populate("FK_neve", "-_id").lean().exec();
            if (document) {
                res.send(document);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private getByKeyword = async (req: Request<{ keyword: string }>, res: Response) => {
        // Example of filtering in both side:
        try {
            const keyword = req.params["keyword"];
            // const myRegex = new RegExp(req.params.keyword, "i"); // "i" for case-insensitive

            // SQL to Aggregation samples:
            // https://www.mongodb.com/docs/manual/reference/sql-aggregation-comparison/
            // https://www.mongodb.com/docs/manual/tutorial/aggregation-zip-code-data-set/
            // https://www.practical-mongodb-aggregations.com/

            const data = await this.nsideM
                .aggregate([
                    {
                        $lookup: { from: "TáblaNeve1", foreignField: "_id", localField: "FK_neve", as: "FK_neve" },
                        // from: The name of the one-side collection!!!
                        // foreignField: Linking field of one-side collection (here the PK: _id)
                        // localField: Linking field of n-side collection (here the FK: FK_neve)
                        // as: alias name, here "FK_neve", but it can be anything you like
                    },
                    {
                        $match: {
                            $or: [
                                { "FK_neve.field1": { $regex: keyword, $options: "i" } },
                                { description: { $regex: keyword, $options: "i" } },
                            ],
                        },
                        // $match: { "FK_neve.field1": req.params.keyword },
                    },
                    {
                        // convert array of objects to simple array (alias name):
                        $unwind: "$FK_neve",
                    },
                    { $project: { _id: 0, prepTime: 0, "FK_neve._id": 0 } },
                ])
                .exec();
            res.send(data);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private getPaginatedData = async (
        req: Request<{ offset: string; limit: string; sortingfield: string; ascdesc: string; filter?: string }>,
        res: Response,
    ) => {
        try {
            const offset = parseInt(req.params["offset"]);
            const limit = parseInt(req.params["limit"]);
            const sortingfield = req.params["sortingfield"];
            const ascdesc = req.params["ascdesc"]; // ASC or DESC
            let paginatedData = [];
            let count = 0;
            if (req.params["filter"] && req.params["filter"] != "") {
                const myRegex = new RegExp(req.params.filter, "i"); // i for case insensitive
                count = await this.nsideM
                    .find({ $or: [{ name: myRegex }, { description: myRegex }] })
                    .count()
                    .exec();
                paginatedData = await this.nsideM
                    .find({ $or: [{ name: myRegex }, { description: myRegex }] })
                    .sort(`${ascdesc == "DESC" ? "-" : ""}${sortingfield}`)
                    .skip(offset)
                    .limit(limit)
                    .lean()
                    .exec();
            } else {
                count = await this.nsideM.countDocuments();
                paginatedData = await this.nsideM
                    .find({})
                    .sort(`${ascdesc == "DESC" ? "-" : ""}${sortingfield}`)
                    .skip(offset)
                    .limit(limit)
                    .lean()
                    .exec();
            }
            res.send({ count: count, data: paginatedData });
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private create = async (req: Request<unknown, unknown, Partial<INSide>>, res: Response) => {
        try {
            const createdDocument = new this.nsideM({
                ...req.body,
            });
            const savedDocument = await createdDocument.save({ validateBeforeSave: true });
            res.send(savedDocument);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private modifyPATCH = async (req: Request<{ id: string }, unknown, Partial<INSide>>, res: Response) => {
        try {
            const id = req.params["id"];
            const updatedDoc = await this.nsideM
                .findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
                .populate("FK_neve", "-_id")
                .exec();
            if (updatedDoc) {
                res.send(updatedDoc);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private modifyPUT = async (req: Request<{ id: string }, unknown, Partial<INSide>>, res: Response) => {
        try {
            const id = req.params["id"];
            const modificationResult = await this.nsideM
                .replaceOne({ _id: id }, req.body, { runValidators: true })
                .exec();
            if (modificationResult.modifiedCount) {
                const updatedDoc = await this.nsideM.findById(id).populate("FK_neve", "-_id").lean().exec();
                res.send(updatedDoc);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };

    private delete = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = req.params["id"];
            const successResponse = await this.nsideM.findByIdAndDelete(id).exec();
            if (successResponse) {
                res.sendStatus(200);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    };
}
