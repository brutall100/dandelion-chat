<section id="chat-container-section">
      <div id="chat-container-messages">
        <ul id="chat-messages"></ul>
        <div id="chat-user-data" chat-data-name="<?php echo isset($name) ? $name : ''; ?>"></div>
      </div>
      <div>
        <form id="chat-form" action="/save-message" method="POST">
          <input id="chat-input-msg" name="user_message" autocomplete="off" />
          <!-- <input type="hidden" id="chat-user-id" name="user_id" value="<?php echo isset($user_id) ? $user_id : ''; ?>"> -->
          <!-- <input type="hidden" id="chat-user-name" name="user_name" value="<?php echo isset($name) ? $name : ''; ?>">  -->
          <button id="chat-button" type="submit">Send</button>
        </form>
      </div>
    </section>