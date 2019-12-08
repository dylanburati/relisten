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
  <title>Index</title>
</head>
<body class="is-boxed">
  <div class="body-wrap boxed-container">
    <header class="site-header">
      <div class="container site-header-inner">
        <div class="brand header-brand">
          <h5 class="m-0">
            <a href="#" style="text-decoration: none; font-size: 20px; font-weight: 300;">
              Relisten
              <!-- Logo -->
            </a>
          </h1>
        </div>
      </div>
    </header>

    <main>
      <section class="hero pt-4 d-flex" style="justify-content: center;">
        <h4 class="px-5 text-center" style="max-width: 784px; margin-top: 32px; font-weight: 300;">
          A customizable, social platform for keeping track of music you like.
        </h4>
      </section>

      <section class="hero text-center">
        <div class="container-sm">
          <div class="hero-inner">
            <div class="d-flex">
              <form id="register-form" action="javascript:doRegister('register-form')" method="post" class="form-signin mx-auto" style="flex-grow: 0;">
                <div class="form-inner p-4" style="background-color: #a7c7e7;">
                  <img src="assets/testlogo.jpg" alt="Relisten logo" width="100" height="100">
                  <label for="inputName" class="sr-only">Username</label>
                  <input type="text" name="name" id="inputName" class="form-control mt-3" placeholder="Username" required autofocus maxlength="30" autocomplete="off">
                  <label for="inputPass" class="sr-only">Password</label>
                  <input type="password" name="pass" id="inputPass" class="form-control mb-2" placeholder="Password" required minlength="8">
                  <button id="form-signin-submit" type="submit" name="submit" class="btn btn-primary" value="submit" style="width: 100%;">Register</button>
                  <p class="text-xs text-secondary mt-1 mb-0">
                    Or <a href="/login.php">login here</a>
                  </p>
                  <p id="error-message" class="text-center text-xs text-secondary mt-2 mb-0" style="display: none; max-width: 250px;"></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section class="features section text-center">
        <div class="container-sm">
          <div class="features-inner section-inner has-bottom-divider">
            <div class="features-wrap">
              <div class="feature">
                <div class="feature-inner">
                  <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="64">
                        <defs>
                            <linearGradient x1="16.65%" y1="87.231%" x2="90.35%" y2="8.197%" id="feature-1-a">
                                <stop offset="25%" stop-color="#77A7FF"></stop>
                                <stop offset="100%" stop-color="#FF8797"></stop>
                            </linearGradient>
                            <linearGradient x1="100%" y1="100%" x2="0%" y2="0%" id="feature-1-b">
                                <stop stop-color="#ccdfff" stop-opacity=".6" offset="0%"></stop>
                                <stop stop-color="#ffccd3" stop-opacity=".36" offset="100%"></stop>
                            </linearGradient>
                            <linearGradient x1="100%" y1="100%" x2="0%" y2="0%" id="feature-1-c">
                                <stop stop-color="#FFF" stop-opacity=".35" offset="0%"></stop>
                                <stop stop-color="#FFF" stop-opacity=".2" offset="100%"></stop>
                            </linearGradient>
                        </defs>
                        <g fill="none" fill-rule="evenodd">
                            <path fill="url(#feature-1-a)" d="M0 0v42h32v-42z"></path>
                            <path fill="url(#feature-1-b)" d="M7 9h32v42H7z"></path>
                            <path fill="url(#feature-1-c)" d="M16 22h32v42H16z"></path>
                        </g>
                    </svg>
                  </div>
                  <p class="h5">Create lists and share them.</p>
                </div>
              </div>
              <div class="hero-browser mt-0">
                <img alt="Preview of list editor" width="800" src="/assets/demo.png">
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cta section">
        <div class="container-sm">
          <div class="cta-inner section-inner">
            <div class="cta-content text-center">
              <h5 class="section-title mt-0">Made with:</h2>
              <div class="libraries d-flex mt-2" style="justify-content: space-evenly; flex-wrap: wrap;">
                <div class="p-2 mx-3 my-2" style="background-color: aliceblue;">
                  <div class="mb-1 d-table" style="width: 100%; height: 64px;">
                    <div class="table-cell-center">
                      <img alt="Vue.js logo" width="64" src="https://vuejs.org/images/logo.png">
                    </div>
                  </div>
                  <a class="text-xs text-secondary" href="https://vuejs.org" rel="noopener noreferrer">Vue.js</a>
                </div>
                <div class="p-2 mx-3 my-2" style="background-color: aliceblue;">
                  <div class="mb-1 d-table" style="width: 100%; height: 64px;">
                    <div class="table-cell-center">
                      <img alt="Vuetify logo" width="64" src="https://cdn.vuetifyjs.com/images/logos/logo.svg">
                    </div>
                  </div>
                  <a class="text-xs text-secondary" href="https://vuetifyjs.com" rel="noopener noreferrer">Vuetify</a>
                </div>
                <div class="p-2 mx-3 my-2" style="background-color: aliceblue;">
                  <div class="mb-1 d-table" style="width: 100%; height: 64px;">
                    <div class="table-cell-center"><img alt="Cruip logo" width="64" src="/assets/credit-logos/cruip.svg"></div>
                  </div>
                  <a class="text-xs text-secondary mt-1" href="https://cruip.com" rel="noopener noreferrer">Cruip</a>
                </div>
                <div class="p-2 mx-3 my-2" style="background-color: aliceblue;">
                  <div class="mb-1 d-table" style="width: 100%; height: 64px;">
                    <div class="table-cell-center">
                      <img alt="MusicBrainz logo" width="64" src="https://wiki.musicbrainz.org/-/images/thumb/6/6d/MusicBrainz_logo_2016.svg/135px-MusicBrainz_logo_2016.svg.png">
                    </div>
                  </div>
                  <a class="text-xs text-secondary" href="https://musicbrainz.org" rel="noopener noreferrer">MusicBrainz</a>
                </div>
                <div class="p-2 mx-3 my-2" style="background-color: aliceblue;">
                  <div class="mb-1 d-table" style="width: 100%; height: 64px;">
                    <div class="table-cell-center">
                      <img alt="Apache Solr logo" width="64" src="https://lucene.apache.org/solr/assets/images/logo.svg" style="background-color: #d9411e;">
                    </div>
                  </div>
                  <a class="text-xs text-secondary" href="https://vuetifyjs.com" rel="noopener noreferrer">Apache Solr</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="site-footer-inner has-top-divider">
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
    function checkInputs(e) {
      e.target.reportValidity();
    }

    function checkNameTakenErr(e) {
      const el = document.getElementById('error-message');
      if(el.style.display === 'block') {
        el.style.display = 'none';
      }
    }

    function doRegister(formID) {
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
      if(empty(formVal.name, 'string')) {
        document.getElementById('error-message').textContent = 'The username field is required.';
        return;
      }
      if(empty(formVal.pass, 'string')) {
        document.getElementById('error-message').textContent = 'The password field is required.';
        return;
      }
      if(formVal.pass.length < 8) {
        document.getElementById('error-message').textContent = 'Your password must be at least 8 characters.';
        return;
      }
      if(formVal.name.length > 30) {
        document.getElementById('error-message').textContent = 'Your username can not be longer than 30 characters.';
        return;
      }
      if(/[^0-9A-Za-z-_\.]/.test(formVal.name)) {
        document.getElementById('error-message').textContent = 'Your username must only contain letters, numbers, dashes, underscores, and periods.';
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

          axios.post('/backend-register.php', formVal)
            .then(function(response) {
              if(response.data.error) {
                const el = document.getElementById('error-message');
                el.textContent = response.data.error;
                el.style.display = 'block';
              } else if(response.data.register === true) {
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
