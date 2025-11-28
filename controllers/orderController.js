import Order from "../models/order.js";

export async function createOrder(req, res) {
  //get User Information
  if (req.user == null) {
    res
      .status(403)
      .json({ message: "User must be logged in to place an order" });
    return;
  }
  //add current user name if not provided
  const orderInfo = req.body;
  if (orderInfo.name == null) {
    orderInfo.name = req.user.firstName + " " + req.user.lastName;
  }

  //orderId generate
  let orderId = "CBC00001";
  const lastOrder = await Order.find().sort({ date: -1 }).limit(1);

  if (lastOrder.length > 0) {
    const lastOrderId = lastOrder[0].orderId;
    //CBC00551
    const lastOrderNumberString = lastOrderId.replace("CBC", "");
    //"00551"
    const lastOrderNumber = parseInt(lastOrderNumberString);
    //551
    const newOrderNumber = lastOrderNumber + 1;
    //552
    const newOrderNumberString = String(newOrderNumber).padStart(5, "0");
    //"00552"
    orderId = "CBC" + newOrderNumberString;
    //CBC00552
  }

  //create order object
  const order = new Order({
    orderId: orderId,
    email: req.user.email,
    name: orderInfo.name,
    address: orderInfo.address,
    total: 0,
    phone: orderInfo.phone,
    products: [],
  });

  try {
    const createdOrder = await order.save();
    res.json({ message: "Order created successfully", order: createdOrder });
  } catch (err) {
    res.status(500).json({ message: "Error creating order", error: err });
    return;
  }
}
