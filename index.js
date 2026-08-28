const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://root:root@localhost:5017/appdb?authSource=admin';

const productSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		price: { type: Number, required: true, min: 0 },
		description: { type: String, trim: true, default: '' },
	},
	{ timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'API funcionando' }));

app.get('/api/products', async (req, res, next) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });
		res.json(products);
	} catch (error) {
		next(error);
	}
});

app.post('/api/products', async (req, res, next) => {
	try {
		const product = await Product.create(req.body);
		res.status(201).json(product);
	} catch (error) {
		next(error);
	}
});

app.get('/api/products/:id', async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });
		res.json(product);
	} catch (error) {
		next(error);
	}
});

app.put('/api/products/:id', async (req, res, next) => {
	try {
		const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
			returnDocument: 'after',
			runValidators: true,
		});
		if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });
		res.json(product);
	} catch (error) {
		next(error);
	}
});

app.delete('/api/products/:id', async (req, res, next) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });
		res.status(204).send();
	} catch (error) {
		next(error);
	}
});

app.use((error, req, res, next) => {
	if (error instanceof mongoose.Error.ValidationError) {
		return res.status(400).json({ error: error.message });
	}
	if (error instanceof mongoose.Error.CastError) {
		return res.status(400).json({ error: 'ID de produto invalido' });
	}
	next(error);
});

async function start() {
	try {
		await mongoose.connect(mongoUri);
		app.listen(port, () => console.log(`Server is running on port ${port}`));
	} catch (error) {
		console.error('Nao foi possivel conectar ao MongoDB:', error.message);
		process.exitCode = 1;
	}
}

start();