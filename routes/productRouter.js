import exxpress from "express";
import {
  deleteProduct,
  getProductById,
  getProducts,
  saveProduct,
  updateProduct,
} from "../controllers/productController.js";

const productRouter = exxpress.Router();

productRouter.get("/", getProducts);
productRouter.post("/", saveProduct);
productRouter.delete("/:productId", deleteProduct);
productRouter.put("/:productId", updateProduct);
productRouter.get("/:productId", getProductById);

export default productRouter;
