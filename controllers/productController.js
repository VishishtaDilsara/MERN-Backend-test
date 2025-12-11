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

export async function updateProduct(req, res) {
  if (!isAdmin(req)) {
    res
      .status(403)
      .json({ message: "Admin access required to update products" });
    return;
  }

  const productId = req.params.productId;
  const updatingData = req.body;

  try {
    await Product.updateOne({ productId: productId }, updatingData);
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err });
  }
}

export async function getProductById(req, res) {
  const productId = req.params.productId;
  try {
    const product = await Product.findOne({ productId: productId });
    if (product == null) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (product.isAvailable) {
      res.json(product);
    } else {
      if (!isAdmin(req)) {
        res.status(404).json({ message: "Product not found" });
        return;
      } else {
        res.json(product);
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Error retrieving product", error: err });
  }
}

export async function searchProducts(req, res) {
  const searchQuery = req.params.query;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { altNames: { $elemMatch: { $regex: searchQuery, $options: "i" } } },
      ],
      isAvailable: true,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error searching products", error: err });
  }
}
