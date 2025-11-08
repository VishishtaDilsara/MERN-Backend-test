import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function getProducts(req, res) {
  try {
    if (isAdmin(req)) {
      const products = await Product.find();
      res.json(products);
    } else {
      const products = await Product.find({ isAvailable: true });
      res.json(products);
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error });
  }
}

export function saveProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  const product = new Product(req.body);

  product
    .save()
    .then(() => {
      res.json({
        message: "Product added successfully",
      });
    })
    .catch(() => {
      res.json({
        message: "Product not added",
      });
    });
}

export async function deleteProduct(req, res) {
  if (!isAdmin(req)) {
    res
      .status(403)
      .json({ message: "Admin access required to delete products" });
    return;
  }
  try {
    await Product.deleteOne({ productId: req.params.productId });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error });
  }
}
