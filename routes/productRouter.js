import exxpress from "express";
import {
  deleteProduct,
  getProducts,
  saveProduct,
} from "../controllers/productController.js";

const productRouter = exxpress.Router();

productRouter.get("/", getProducts);
productRouter.post("/", saveProduct);
productRouter.delete("/:productId", deleteProduct);

export default productRouter;
