<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokumentas</title>
  <link rel="stylesheet" href="styles.css">
</head>


<body>
  <header>
    <div class='header'>
      <h3>HEADER</h3>
    </div>
  </header>

  <main>
    <section id="chat-container-section">
        <div id="chat-container-messages">
            <ul id="chat-messages"></ul>
        </div>
        <div>
            <form id="chat-form" method="POST" action="http://localhost:9000/save-message" >
            <input id="chat-input-msg" name="user_message" autocomplete="off" />
            <button id="chat-button" type="submit">Send</button>
            </form>
        </div>
        </section>
  </main>
 
  <footer>
    <div class='footer'>
      <h3>FOOTER</h3>
    </div>
  </footer>
</body>
</html>
