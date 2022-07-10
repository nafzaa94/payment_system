const express = require('express');
const dotenv = require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');

const app = express();

// handlebars middleware
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set static folder
app.use(express.static(`${__dirname}/public`));

// index route
app.get('/', (req, res) => {
    res.render('index');
    }
);

app.post(
    "webhook",
    bodyParser.raw({ type: "application/json" }),
    (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        }
        catch (err) {
            return res.status(400).end();
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            console.log(session);
            res.sendStatus(200);
        }
    })


app.get('/success', (req, res) => {
    res.render('success');
})

app.get('/cancel', (req, res) => {
    res.render('cancel');
})

const YOUR_DOMAIN = 'http://localhost:5000';

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: 'price_1LEdo3BMuuRrw3D0O5p8UUjz',
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_method_types: ['fpx'],
    success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/cancel`,
  });

  res.redirect(303, session.url);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
}
);