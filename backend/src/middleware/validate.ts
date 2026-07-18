import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

// Wraps a Zod schema so a route can validate body/query/params in one line:
//   router.post("/", validate(createTripSchema), controller.create)
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body ?? req.body;
    next();
  };
}
