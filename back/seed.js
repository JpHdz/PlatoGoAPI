const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Restaurant = require("./models/restaurantModel");
const Table = require("./models/tableModel");
const User = require("./models/userModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
    "<DATABASE_PASSWORD>",
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful"));

const seedData = async () => {
    try {
        // Create Restaurant
        let restaurant = await Restaurant.findOne();
        if (!restaurant) {
            restaurant = await Restaurant.create({
                nombre: "PlatoGo Default",
                direccion: "123 Main St",
                telefono: "555-1234",
                email: "contact@platogo.com",
                horario: "9am - 10pm"
            });
            console.log("Restaurant created:", restaurant._id);
        } else {
            console.log("Restaurant already exists:", restaurant._id);
        }

        // Create Table
        let table = await Table.findOne({ numero: 2 });
        if (!table) {
            table = await Table.create({
                numero: 2,
                name: "Mesa 2",
                capacity: 4,
                location: "Main Hall",
                restaurant: restaurant._id,
                estado: "libre"
            });
            console.log("Table 2 created:", table._id);
        } else {
            console.log("Table 2 already exists:", table._id);
        }

        console.log("Seeding completed");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
