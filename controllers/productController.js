import Product from "../models/product.js";

export function getProducts(req, res) {
  Product.find().then((data) => {
    res.json(data);
  });
}

export function saveProduct(req, res) {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
  });

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
