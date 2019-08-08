<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="content-type" content="text/html;charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, minimal-ui">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
  <link rel="stylesheet" href="/index.css">
  <title>About</title>
</head>
<body class="is-boxed">
  <div class="body-wrap boxed-container">
    <header class="site-header">
      <div class="container">
        <div class="site-header-inner">
          <div class="brand header-brand">
            <h5 class="m-0">
              <a href="/" style="text-decoration: none; font-size: 20px; font-weight: 300;">
                Relisten
                <!-- Logo -->
              </a>
            </h1>
          </div>
        </div>
      </div>
    </header>

    <main class="d-flex" style="flex-direction: column;">
      <div class="container-sm">
        <div class="hero-inner p-3 pb-5">
          <code class="d-block mr-3 p-0" style="font-size: .875rem; flex-grow: 1; white-space: pre-wrap"></code>
          <div class="d-flex mt-4">
            <p>
              Created by Dylan Burati.<br>
              --
            </p>
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
              <a href="/about.php">About us</a>
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
  <script type="text/javascript">
    function successOrError(fn, success) {
      try {
        fn();
        return success;
      } catch(error) {
        return error;
      }
    }

    document.querySelector("code").textContent = getRelativeTimeString(Date.now() / 1000);
    sleep(1000).then(function() {
      document.querySelector("code").textContent += "\nPromises \u2714";
      sleep(1000).then(() => {
        document.querySelector("code").textContent += "\nArrow functions \u2714";;
      sleep(1000).then(() => {
        document.querySelector("code").textContent += '\n' + successOrError(
          () => { const t = 0; let e = 1; }, "const and let \u2714");
      sleep(1000).then(() => {
        document.querySelector("code").textContent += '\n' + successOrError(
          () => { Object.assign({}, { t: 3 }); }, "Object.assign \u2714");
      sleep(1000).then(() => {
        document.querySelector("code").textContent += '\n' + successOrError(
          () => { const [t, e] = [1, 2]; }, "Array destructuring \u2714");
      });
      });
      });
      });
    });
  </script>
</body>
</html>
