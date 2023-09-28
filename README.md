# Chat_App

A simple chat application demonstrating how chat functionality works using Node.js, Express, and MySQL.

## Table of Contents
- [Database](#database)
- [Database Structure](#database-structure)
- [Installing Dependencies](#installing-dependencies)
- [Running the Server](#running-the-server)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Database

Before running the chat application, you need to set up your MySQL database. Create a `.env` file in your project directory and add the following database configuration:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=chat
Replace the values with your actual database credentials.

## Database Structure
The chat application uses a MySQL database with the following structure:

Table: chat_app_db
chat_id (int, AUTO_INCREMENT)
chat_msg (text)

## Installing Dependencies
To get started, follow these steps:

Navigate to your project directory and run the following command to initialize your Node.js project:

npm init
Install the required packages (Express, MySQL2, and dotenv) using npm:

npm install express mysql2 dotenv
Running the Server
To run the chat server, execute the following command:

node server.js
The server will start on port 9000 by default. You can access the chat application at http://localhost:9000.

## Usage
The chat application allows users to send messages, which are stored in the MySQL database. To save a message, send a POST request to /save-message with the user_message parameter containing the message text.

Example using cURL:

## Contributing
Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

Fork the repository.
Create a new branch for your feature or bug fix.
Make your changes and test them thoroughly.
Submit a pull request with a clear description of your changes.

## License
This project is licensed under the MIT License.
MIT License

Copyright (c) 2023 brutall100

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


