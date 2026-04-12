USE bookmart;

INSERT INTO products (title, author, description, price, stock, image_url, category_id, rating) VALUES
('The Pragmatic Programmer', 'David Thomas', 'A masterclass in software engineering.', 39.99, 50, '', 2, 4.8),
('Clean Code', 'Robert C. Martin', 'A Handbook of Agile Software Craftsmanship.', 45.00, 30, '', 2, 4.9),
('Dune', 'Frank Herbert', 'A science fiction masterpiece.', 15.99, 100, '', 1, 4.7),
('Atomic Habits', 'James Clear', 'An Easy & Proven Way to Build Good Habits.', 20.00, 200, '', 3, 4.9),
('Sapiens', 'Yuval Noah Harari', 'A Brief History of Humankind.', 24.99, 80, '', 4, 4.8),
('1984', 'George Orwell', 'Dystopian social science fiction novel.', 12.99, 45, '', 1, 4.6);