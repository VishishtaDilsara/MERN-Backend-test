import exxpress from "express";
import { getProducts, saveProduct } from "../controllers/productController.js";

const productRouter = exxpress.Router();

productRouter.get("/", getProducts);
productRouter.post("/", saveProduct);

export default productRouter;
