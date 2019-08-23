if [ ! -f ./node_modules/.bin/webpack ]; then
    echo 'Webpack not found' 1>&2
    echo 'Try running npm install --save-dev '
    exit 1
fi

find src/ -execdir chmod 755 '{}' ';'
if [[ " $@ " =~ ' --skip-webpack ' ]]; then
    SKIP_WEBPACK=true
fi

if [[ " $@ " =~ ' --skip-vue ' ]]; then
    SKIP_VUE=true
fi

if [ -z "$SKIP_WEBPACK" -a -z "$SKIP_VUE" ]; then
    rsync -a --delete --exclude 'build-*' src/ dist/
else
    rsync -a --exclude 'build-*' src/ dist/
fi

if [ -z "$SKIP_WEBPACK" ]; then
    WEBPACK_MODE="production"
    [[ " $@ " =~ ' --dev ' ]] && WEBPACK_MODE="development"
    mkdir -p dist/js
    ./node_modules/.bin/webpack --mode $WEBPACK_MODE --target web
    echo
fi

if [ -z "$SKIP_VUE" ]; then
    mkdir -p dist/views
    node detemplate.js src/build-vue dist/views
fi
