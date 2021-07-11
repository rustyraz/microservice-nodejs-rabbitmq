const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Product = require('./ProductModel');
const isAuthenticated = require('./isAuthenticated');

const app = express();
const mongoDBConnectionUrl = 'mongodb://localhost:27019/eshop-product-service';
const PORT = process.env.PORT || 5051;
app.use(express.json());
//app.use(cors());

mongoose.connect(
    mongoDBConnectionUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    () => {
        console.log(`Eshop-product-service connected to Database`);
    }
);

let channel, connection;
async function connect(){    
    const amqpServer = 'amqp://localhost:5673';
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT"); 
    
}

connect().then(() => {
    console.log('AMQP connection established')
    channel.consume('PRODUCT', (data) => {
        console.log('Consuming from product queue')
        const order = JSON.parse(data.content);
        channel.ack(data);
    });
}).catch((error) => {
    console.error(error);
    throw error;
});

app.get('/', (req, res) => {
    return res.send('E-Shop product service running here.')
});

app.get('/products', isAuthenticated, async (req, res) => {
    const products = await Product.find();
    return res.json(products);
});

app.get('/products/:id', async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id);
    if(!product){
        return res.status(404).send('Product with that ID is missing');
    }
    return res.json(product)
});

app.post('/products', isAuthenticated, (req, res) => {
    const { name, description, price } = req.body;
    const newProduct = new Product({
        name,
        description,
        price
    });
    newProduct.save();
    return res.json({ product: newProduct })
});

//user sends a list of products IDs to buy
app.post('/products/buy', isAuthenticated, async (req, res) => {
    let order = undefined;
    const { ids } = req.body;
    const products =  await Product.find({ _id: { $in: ids }});
    //assumming that all the products were found
    channel.sendToQueue(
        'ORDER',
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email
            })
        )
    );
    channel.consume('PRODUCT', (data) => {
        console.log('Consuming from product queue')
        order = JSON.parse(data.content);
        channel.ack(data);
    });
    return res.json({
        message: "Order request placed successfully",
        order
    });
});

app.listen(PORT, () => {
    console.log(`Product service is running on port: ${PORT}`);
});