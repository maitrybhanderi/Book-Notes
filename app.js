import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import axios from "axios";

dotenv.config();
const { Pool } = pg;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.set("view engine","ejs");

const PORT = 3000;

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
});

db.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.log("Database connection failed");
    } else {
        console.log("Database connected");
    }
});

app.get("/", (req, res) => {

    const sort = req.query.sort;

    let query = "SELECT * FROM books";

    if (sort === "rating") {
        query = "SELECT * FROM books ORDER BY rating DESC";
    }

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("index", { books: result.rows });
    });
});

app.post("/add-book", async(req, res) => {
    
    const { title, author, rating, notes, date_read } = req.body;

    const response = await axios.get(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
    );

    const book = response.data.docs[0];
    const coverId = book.cover_i;

    const coverURL = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    
    db.query(
        "INSERT INTO books (title, author, rating, notes, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6)",
        [title, author, rating, notes, date_read, coverURL],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }
            res.redirect("/");
        }
    );
});

app.get("/edit/:id", (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM books WHERE id = $1", [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("edit", { book: result.rows[0] });
    });
});

app.post("/edit/:id", (req, res) => {
    const id = req.params.id;

    const { title, author, rating, notes, date_read } = req.body;

    db.query(
        "UPDATE books SET title = $1, author = $2, rating = $3, notes = $4, date_read = $5 WHERE id = $6",
        [title, author, rating, notes, date_read, id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/");
        }
    );
});

app.post("/delete/:id", (req, res) => {
    const id = req.params.id;

    db.query(
        "DELETE FROM books WHERE id = $1",
        [id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/");
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
