
document.addEventListener("DOMContentLoaded", function () {

    // THEME COLORS
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq.matches) {
        document.body.style.background = "black";
        var board_green = '#707766';
        var board_white = '#CCCCBB';
    } else {
        document.body.style.background = "white";
        var board_green = '#909988';
        var board_white = '#EEEEDD';
    }

    // PIECE SETS
    // Choose piece set from the list at https://github.com/pychess/pychess/tree/master/pieces:
    piece_sets =
        'alfonso, alpha, california, cardinal, cburnett, celtic, chess7, chessicons, chessmonk, chessnut, companion, dubrovny, \
        eyes, fantasy, fantasy_alt, freak, freestaunton, fresca, gioco, governor, horsey, icpieces, kilfiger, kosal, leipzig, \
        letter, libra, maestro, magnetic, makruk, maya, merida, merida_new, metaltops, pirat, pirouetti, pixel, prmi, \
        regular, reillycraig, riohacha, shapes, sittuyin, skulls, spatial, staunty, tatiana, ttf'.split(', ');
    var piece_set = 'merida_new';
    // var piece_set = piece_sets[Math.floor(Math.random() * piece_sets.length)];

    var piece_source = 'https://raw.githubusercontent.com/pychess/pychess/f417c22b31f8d79975ce9962d93910797cf827ca/pieces/';

    var pieces = ['b', 'k', 'n', 'p', 'q', 'r', 'B', 'K', 'N', 'P', 'Q', 'R'];
    var pieces_alt = ['bb', 'bk', 'bn', 'bp', 'bq', 'br', 'wb', 'wk', 'wn', 'wp', 'wq', 'wr'];
    var pieces_verbose = [
        'black bishop', 'black king', 'black knight', 'black pawn', 'black queen', 'black rook',
        'white bishop', 'white king', 'white knight', 'white pawn', 'white queen', 'white rook'
    ];

    var svg_images = []
    for (let p of pieces_alt) svg_images.push(piece_source + piece_set + '/' + p + '.svg');

    // RESPONSIVE BOARD
    var board = document.createElement('div');
    board.draggable = false;
    function resizeBoard() {
        var height = document.body.clientHeight;
        var width = document.body.clientWidth;
        board.style.width = board.style.height = Math.min(height, width) + 'px';
        board.style.left = (width - Math.min(height, width)) / 2 + 'px';
        board.style.top = (height - Math.min(height, width)) / 2 + 'px';
        board.style.border = '1px solid #000000';
        board.style.position = 'absolute';
    }
    window.addEventListener('resize', resizeBoard);
    resizeBoard(board);
    document.body.appendChild(board);

    // HELPER FUNCTIONS
    const let_num = { 'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5', 'f': '6', 'g': '7', 'h': '8' };
    const num_let = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f', '7': 'g', '8': 'h' };
    i_nn = (i) => (Math.floor(i / 8) + 1) + '' + (i % 8 + 1);
    nn_i = (nn) => 8 * (parseInt((nn + '').charAt(0)) - 1) + parseInt((nn + '').charAt(1)) - 1;
    sn_nn = (sn) => sn.replace(/[a-h]/g, ch => let_num[ch]);
    nn_sn = (nn) => nn.charAt(0).replace(/[1-8]/g, ch => num_let[ch]) + nn.charAt(1);
    squ = (sn) => squares[nn_i(sn_nn(sn))];
    color = (piece) => pieces_verbose[pieces.indexOf(piece.id)].slice(0, 5);

    // SQUARES
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let square = document.createElement('div');
            square.className = 'square';
            square.id = (i + 1) + '' + (j + 1);
            square.legal = false;
            square.draggable = false;
            square.style.width = square.style.height = '12.5%';
            square.style.backgroundColor = (i + j) % 2 == 0 ? board_green : board_white;
            square.style.position = 'absolute';
            square.style.left = i * 12.5 + '%';
            square.style.top = (7 - j) * 12.5 + '%';
            square.isEmpty = () => square.children.length == 0 || square.children[0].className == 'legal';
            board.appendChild(square);
            square.addEventListener('click', clickOnSquare);
            square.ondragenter = dragEnterSquare;
        }
    }
    squares = board.children;

    // PIECES
    function putPiece(piece, square_name) {
        let square = squ(square_name);
        let img = document.createElement('img');
        img.src = svg_images[pieces.indexOf(piece)];
        img.id = piece;
        img.className = 'piece';
        img.draggable = true;
        img.style.position = 'absolute';
        img.style.width = img.style.height = '90%';
        img.style.position = 'absolute';
        img.style.left = img.style.top = '5%';
        square.appendChild(img);
        img.addEventListener('click', clickOnPiece);
        img.onmouseenter = (e) => img.style.cursor = 'grab';

    }

    // INITIAL SETUP
    initial_positions = {
        'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R',  // White back row
        'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',  // White pawns
        'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r',  // Black back row
        'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p'   // Black pawns
    }
    Object.entries(initial_positions).forEach(([sq, p]) => putPiece(p, sq));
    var piece_list = Array.from(board.getElementsByClassName('piece'));
    piece_list.filter((p) => p.id == 'K' || p.id == 'k').forEach((p) => p.canCastle = true);
    piece_list.filter((p) => p.id == 'R' || p.id == 'r').forEach((p) => p.canCastle = true);
    piece_list.filter((p) => p.id == 'P' || p.id == 'p').forEach((p) => p.movex2 = false);
    var history = [];

    // GAMEPLAY
    var whiteTurn = true;
    turnColor = () => whiteTurn ? 'white' : 'black';
    var selected = null;
    var target_sq = null;

    var legal_squares = [];
    newLegalCircle = () => {
        var c = document.createElement('img');
        c.src = 'https://swain.com/wp-content/uploads/2016/01/1000px-Ski_trail_rating_symbol-green_circle.svg_.png';
        c.className = 'legal';
        c.style.position = 'absolute';
        c.style.width = c.style.height = '40%';
        c.style.left = c.style.top = '30%';
        c.style.opacity = 0.3;
        c.style.pointerEvents = 'none'
        return c;
    }

    function applyLaw(im) {
        // Remove old legal squares
        for (let square of legal_squares) {
            square.legal = false;
            for (let child of square.children) {
                if (child.className == 'legal') child.remove();
            }
        }
        legal_squares = [];
        if (im == null) return;
        // Legal squares
        for (let square of squares) {
            if (isLegalMove(im, im.parentElement, square)) legal_squares.push(square);
        }
        for (square of legal_squares) {
            square.legal = true;
            square.appendChild(newLegalCircle());
        }
    }

    function isLegalMove(piece, fromSquare, toSquare) {
        if (!toSquare.isEmpty() && color(toSquare.children[0]) == turnColor()) return false; // Can't eat your own pieces
        let fromSQ = [fromSquare.id.charAt(0), fromSquare.id.charAt(1)];
        let toSQ = [toSquare.id.charAt(0), toSquare.id.charAt(1)];
        let x = parseInt(toSQ[0]) - parseInt(fromSQ[0]);
        let y = parseInt(toSQ[1]) - parseInt(fromSQ[1]);
        switch (piece.id) {
            case 'k': case 'K':
                if (Math.abs(x) <= 1 && Math.abs(y) <= 1) return true;
                if (Math.abs(x) == 2 && y == 0 && piece.canCastle) {
                    let rook = squares[nn_i((x == 2 ? '8' : '1') + fromSQ[1])].children[0];
                    let isRook = rook != null && (rook.id == 'R' || rook.id == 'r');
                    if (isRook && rook.canCastle && pathEmpty(fromSQ, (x == 2 ? 3 : -4), y)) return true;
                }
                return false;
            case 'n': case 'N': return Math.abs(x) + Math.abs(y) == 3 && x * y != 0;
            case 'p':
                if (((x == 1 && y == -1) || (x == -1 && y == -1))) {
                    if (!toSquare.isEmpty()) return true; // Eat standard
                    if (fromSQ[1] == 4) { // Eat en passant
                        let sqPassant = squares[nn_i(toSQ[0] + '' + fromSQ[1])];
                        if (sqPassant.isEmpty()) return false;
                        if (sqPassant.children[0].id == 'P' && sqPassant.children[0].movex2) return true;
                    }
                }
                if ((x == 0 && y == -1) && toSquare.isEmpty()) return true; // Move Forward 1
                if (fromSQ[1] == 7 && y == -2 && x == 0 && pathEmpty(fromSQ, x, y - 1)) return true; // Move forward 2
                return false;
            case 'P':
                if (((x == 1 && y == 1) || (x == -1 && y == 1))) {
                    if (!toSquare.isEmpty()) return true; // Eat standard
                    if (fromSQ[1] == 5) { // Eat en passant
                        let sqPassant = squares[nn_i(toSQ[0] + '' + fromSQ[1])];
                        if (sqPassant.isEmpty()) return false;
                        if (sqPassant.children[0].id == 'p' && sqPassant.children[0].movex2) return true;
                    }
                }
                //  && !toSquare.isEmpty()) return true; // Eat standard
                if ((x == 0 && y == 1) && toSquare.isEmpty()) return true; // Move Forward 1
                if (fromSQ[1] == 2 && y == 2 && x == 0 && pathEmpty(fromSQ, x, y + 1)) return true; // Move forward 2
                return false;
            case 'b': case 'B': return (x == y || x == -y) && pathEmpty(fromSQ, x, y);
            case 'q': case 'Q': return (x == y || x == -y || x == 0 || y == 0) && pathEmpty(fromSQ, x, y);
            case 'r': case 'R': return (x == 0 || y == 0) && pathEmpty(fromSQ, x, y);
        }
    }

    function pathEmpty(fromSQ, x, y) {
        let items = Math.max(Math.abs(x), Math.abs(y));
        incX = x / items || 0;
        incY = y / items || 0;
        for (let i = 1; i < parseInt(items); i++) {
            let sq = squares[nn_i((parseInt(fromSQ[0]) + (incX * i)) + '' + (parseInt(fromSQ[1]) + (incY * i)))];
            if (!sq.isEmpty()) {
                return false
            }
        }
        return true;
    }

    function move(piece, square) {
        history.push({ piece: piece.id, from: piece.parentElement.id, to: square.id });
        // Remove movex2 if pawn moved 2 turns ago
        if (history.length > 2) {
            if (history[history.length - 3].piece == 'p' || history[history.length - 3].piece == 'P') {
                let old_pawn = squares[nn_i(history[history.length - 3].to)].children[0];
                if (old_pawn) old_pawn.movex2 = false;
            }
        }
        // console.log(history[history.length - 1]);

        if (piece.id == 'K' || piece.id == 'k' || piece.id == 'R' || piece.id == 'r') {
            piece.canCastle = false;
            if (piece.id == 'K' || piece.id == 'k') {
                let row = square.id.charAt(1);
                if (square.id.charAt(0) - piece.parentElement.id.charAt(0) == 2) { // Short castle
                    square.appendChild(piece);
                    let row = (piece.id == 'K' ? 1 : 8);
                    squares[nn_i('6' + row)].appendChild(squares[nn_i('8' + row)].children[0]);
                    deselect();
                    whiteTurn = !whiteTurn;
                    return;
                }
                if (square.id.charAt(0) - piece.parentElement.id.charAt(0) == -2) { // Long castle
                    square.appendChild(piece);
                    squares[nn_i('4' + row)].appendChild(squares[nn_i('1' + row)].children[0]);
                    deselect();
                    whiteTurn = !whiteTurn;
                    return;
                }
            }
        }
        else if (piece.id == 'P' || piece.id == 'p') {
            if (Math.abs(square.id.charAt(1) - piece.parentElement.id.charAt(1)) == 2) { // Double move
                piece.movex2 = true;
            } else {
                piece.movex2 = false;
                if (square.id.charAt(0) != piece.parentElement.id.charAt(0) && square.isEmpty()) { // En passant
                    squares[nn_i(square.id.charAt(0) + '' + piece.parentElement.id.charAt(1))].children[0].remove();
                    square.appendChild(piece);
                    deselect();
                    whiteTurn = !whiteTurn;
                    return;
                }
                if (square.id.charAt(1) == 8 || square.id.charAt(1) == 1) { // Promotion
                    let eaten = square.children[0];
                    if (eaten != null) eaten.remove();
                    piece.remove();
                    putPiece((piece.id == 'P' ? 'Q' : 'q'), nn_sn(square.id));
                    deselect();
                    whiteTurn = !whiteTurn;
                    return;
                }
            }
        }
        // Eat if there is another piece
        let eaten = square.children[0];
        if (eaten != null) eaten.remove();
        square.appendChild(piece);
        deselect();
        whiteTurn = !whiteTurn;
    }

    function select(im) {
        selected = im;
        im.style.width = im.style.height = '100%';
        im.style.left = im.style.top = '0%';
        applyLaw(im);
    }
    function deselect() {
        if (selected == null) return;
        selected.style.width = selected.style.height = '90%';
        selected.style.left = selected.style.top = '5%';
        selected = null;
        applyLaw(null);
    }

    // EVENT HANDLERS
    function clickOnSquare() {
        if (selected != null && selected != this.children[0] && legal_squares.indexOf(this) != -1) {
            move(selected, this);
        };
    }
    function dragEnterSquare() { target_sq = this; }

    function clickOnPiece() {
        if (selected == null && color(this) == turnColor()) {
            select(this);
        } else if (this === selected) {
            deselect();
        } else if (selected != null && legal_squares.indexOf(this.parentElement) != -1) {
            move(selected, this.parentElement);
        } else if (selected != null && color(this) == turnColor()) {
            deselect();
            select(this);
        } else {
            deselect();
        }
    }

    board.ondragstart = (e) => {
        // e.overrideDefault();  // If uncommented, need to re-program a lot of useful behavior
        if (pieces.indexOf(e.target.id) == -1) return;
        let img = e.target;
        img.style.opacity = '0';
        board.style.cursor = 'grabbing';  // Doesn't work! (default is 'not-allowed')
        if (color(img) == turnColor()) {
            deselect();
            select(img);
        } else {
            deselect();
        }
    };

    board.ondragend = (e) => {
        if (pieces.indexOf(e.target.id) == -1) return; // Exit if not a piece
        let img = e.target;
        if (target_sq != null) {
            if (legal_squares.indexOf(target_sq) != -1 && img.parentElement != target_sq) {
                move(img, target_sq);
            }
        }
        deselect();
        img.style.opacity = '1';
        board.style.cursor = 'auto';
    };

});