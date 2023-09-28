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


