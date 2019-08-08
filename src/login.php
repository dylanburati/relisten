<?php
session_start();


if(!empty($_SESSION['user'])) {
  header("Location: /dashboard");
  die();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="content-type" content="text/html;charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, minimal-ui">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
  <link rel="stylesheet" href="/index.css">
  <title>Login</title>
</head>
<body class="is-boxed">
  <div class="body-wrap boxed-container">
    <header class="site-header">
      <div class="container site-header-inner">
        <div class="brand header-brand">
          <h5 class="m-0">
            <a href="/" style="text-decoration: none; font-size: 20px; font-weight: 300;">
              Relisten
              <!-- Logo -->
            </a>
          </h1>
        </div>
      </div>
    </header>

    <main class="d-flex" style="flex-direction: column; justify-content: center;">
      <div class="container-sm">
        <div class="hero-inner pb-5">
          <div class="d-flex">
            <form id="login-form" action="javascript:doLogin('login-form')" method="post" class="form-signin mx-auto" style="flex-grow: 0;">
              <div class="form-inner p-4" style="background-color: #a7c7e7;">
                <img src="assets/testlogo.jpg" alt="" width="100" height="100">
                <label for="inputName" class="sr-only">Username</label>
                <input type="text" name="name" id="inputName" class="form-control mt-3" placeholder="Username" required autofocus>
                <label for="inputPass" class="sr-only">Password</label>
                <input type="password" name="pass" id="inputPass" class="form-control mb-2" placeholder="Password" required>
                <button id="form-signin-submit" type="submit" name="submit" class="btn btn-primary" value="submit" style="width: 100%;">Login</button>
                <p class="text-xs text-secondary mt-1 mb-0">
                  Or <a href="/register.php">register here</a>
                </p>
                <p id="error-message" class="text-center text-xs text-secondary mt-2 mb-0" style="display: none; max-width: 250px;"></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="site-footer-inner">
          <ul class="footer-links list-reset">
            <li>
              <a href="#">Contact</a>
            </li>
            <li>
              <a href="/about.html">About us</a>
            </li>
            <li>
              <a href="/help.php">Support</a>
            </li>
          </ul>
          <div class="brand footer-brand">
            <a href="#">
              <!-- Logo -->
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  <script src="/js/util.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/big-integer@1.6.36/BigInteger.min.js"></script>
  <script src="/js/register.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@0.18.0/dist/axios.min.js"></script>
  <script type="text/javascript">
    function setError(msg) {
      const el = document.getElementById('error-message');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function checkInputs(e) {
      e.target.reportValidity();
    }

    function checkNameTakenErr(e) {
      const el = document.getElementById('error-message');
      if(el.style.display === 'block') {
        el.style.display = 'none';
      }
    }

    function doLogin(formID) {
      const form = document.getElementById(formID);
      const formVal = {};
      Array.from(form.elements).forEach(input => {
        if(input.name === 'name') {
          formVal.name = input.value;
        } else if(input.name === 'pass') {
          formVal.pass = input.value;
        } else if(input.name === 'submit') {
          formVal.submit = input.value;
        }
      });
      if(empty(formVal.name, 'string') || empty(formVal.pass, 'string')) {
        throw new Error('Form inputs invalid');
      }

      formVal.keys = {};
      const identityKey = new DHKeyPair(true);
      const prekey = new DHKeyPair(true);
      const keyWrapperPromise = generateKeyWrapper(formVal.pass);
      keyWrapperPromise.then(function(keyWrapper) {
        formVal.keys.identity_public = base64encodebytes(identityKey.getPublicEncoded());
        const identityPrivatePromise = identityKey.getPrivateWrapped(keyWrapper.keyWrapper);
        formVal.keys.prekey_public = base64encodebytes(prekey.getPublicEncoded());
        const prekeyPrivatePromise = prekey.getPrivateWrapped(keyWrapper.keyWrapper);
        Promise.all([identityPrivatePromise, prekeyPrivatePromise]).then(function(wrappedPrivateKeys) {
          formVal.keys.identity_private = wrappedPrivateKeys[0];
          formVal.keys.prekey_private = wrappedPrivateKeys[1];

          axios.post('/backend-login.php', formVal)
            .then(function(response) {
              if(response.data.error) {
                const el = document.getElementById('error-message');
                el.textContent = response.data.error;
                el.style.display = 'block';
              } else if(response.data.login === true) {
                localStorage.setItem('keyWrapper', keyWrapper.storage);
                window.location = '/dashboard';
              }
            });
        });
      });
    }

    document.getElementById('inputName').addEventListener('input', checkNameTakenErr);
    document.getElementById('inputPass').addEventListener('input', checkNameTakenErr);
  </script>
</body>
</html>
