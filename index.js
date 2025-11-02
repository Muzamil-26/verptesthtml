<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-900">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ApniBhasha Interpreter</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        /* Custom scrollbar for webkit browsers */
        textarea::-webkit-scrollbar, pre::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        textarea::-webkit-scrollbar-track, pre::-webkit-scrollbar-track {
            background: #1f2937; /* gray-800 */
        }
        textarea::-webkit-scrollbar-thumb, pre::-webkit-scrollbar-thumb {
            background: #4b5563; /* gray-600 */
            border-radius: 4px;
        }
        textarea::-webkit-scrollbar-thumb:hover, pre::-webkit-scrollbar-thumb:hover {
            background: #6b7280; /* gray-500 */
        }
        .code-font {
            font-family: 'Fira Code', monospace;
        }
    </style>
</head>
<body class="h-full text-gray-200">
    <div class="flex flex-col h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Header -->
        <header class="mb-4">
            <h1 class="text-3xl font-bold text-white">ApniBhasha Interpreter</h1>
            <p class="text-lg text-gray-400">Your custom language runner. Keywords: `ye`, `bol`, `agar`, `toh`</p>
        </header>
        
        <!-- Run Button -->
        <div class="mb-4">
            <button id="runButton" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5">
                Run Code
            </button>
        </div>

        <!-- Main Content: 2-column layout -->
        <div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            
            <!-- Column 1: Code Input -->
            <div class="flex flex-col h-full min-h-[400px] md:min-h-0">
                <label for="codeInput" class="text-sm font-medium text-gray-300 mb-2">ApniBhasha Code (Your .apni file)</label>
                <textarea id="codeInput" class="code-font flex-grow bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none shadow-inner outline-none focus:ring-2 focus:ring-indigo-500" spellcheck="false">
// Welcome to ApniBhasha!

ye num1 = 10
ye num2 = 25
ye message = "Hello World"

bol "Running calculations..."
bol num1 + num2

agar (num1 > num2) {
  bol "Num 1 bada hai"
} toh {
  bol "Num 2 bada hai"
}

// Assignment
num1 = 50
bol "New num1:", num1

// Logical operators
agar (num1 > num2 && message == "Hello World") {
  bol "Sab sahi hai!"
}

// Nested if-else
ye a = 5
agar (a == 1) {
    bol "One"
} toh agar (a == 5) {
    bol "Five"
} toh {
    bol "Something else"
}
</textarea>
            </div>

            <!-- Column 2: Outputs -->
            <div class="flex flex-col gap-6 h-full min-h-[400px] md:min-h-0">
                
                <!-- Output -->
                <div class="flex flex-col flex-1 min-h-0">
                    <label for="output" class="text-sm font-medium text-gray-300 mb-2">Output (from `bol`)</label>
                    <pre id="output" class="code-font flex-grow bg-gray-800 border border-gray-700 rounded-lg p-4 text-green-400 overflow-auto shadow-inner"></pre>
                </div>

                <!-- Generated JS -->
                <div class="flex flex-col flex-1 min-h-0">
                    <label for="generatedJs" class="text-sm font-medium text-gray-300 mb-2">Generated JavaScript (Transpiled Code)</label>
                    <pre id="generatedJs" class="code-font flex-grow bg-gray-800 border border-gray-700 rounded-lg p-4 text-cyan-400 text-sm overflow-auto shadow-inner"></pre>
                </div>

            </div>
        </div>
    </div>

    <script>
        // --- 1. TOKEN TYPES ---
        // An "enum" of all the token types our Lexer will create.
        const TOKEN_TYPES = {
            // Keywords
            YE: 'YE',       // ye
            BOL: 'BOL',     // bol
            AGAR: 'AGAR',   // agar
            TOH: 'TOH',     // toh
            
            // Literals
            IDENTIFIER: 'IDENTIFIER', // variable names
            NUMBER: 'NUMBER',     // 10, 20.5
            STRING: 'STRING',     // "hello"

            // Single-character operators
            L_PAREN: 'L_PAREN',   // (
            R_PAREN: 'R_PAREN',   // )
            L_BRACE: 'L_BRACE',   // {
            R_BRACE: 'R_BRACE',   // }
            PLUS: 'PLUS',         // +
            MINUS: 'MINUS',       // -
            STAR: 'STAR',         // *
            SLASH: 'SLASH',       // /
            EQUAL: 'EQUAL',       // =
            LESS: 'LESS',         // <
            GREATER: 'GREATER',   // >
            BANG: 'BANG',         // !

            // Multi-character operators
            EQUAL_EQUAL: 'EQUAL_EQUAL', // ==
            BANG_EQUAL: 'BANG_EQUAL',   // !=
            LESS_EQUAL: 'LESS_EQUAL',   // <=
            GREATER_EQUAL: 'GREATER_EQUAL', // >=
            AND: 'AND',           // &&
            OR: 'OR',             // ||
            
            // Misc
            SEMICOLON: 'SEMICOLON', // ; (optional, but good to support)
            COMMA: 'COMMA',         // ,
            EOF: 'EOF'              // End of File
        };

        // Map of keywords to their token types
        const KEYWORDS = {
            "ye": TOKEN_TYPES.YE,
            "bol": TOKEN_TYPES.BOL,
            "agar": TOKEN_TYPES.AGAR,
            "toh": TOKEN_TYPES.TOH
        };

        // --- 2. LEXER (TOKENIZER) ---
        // Takes raw code as a string and outputs an array of tokens.
        class Lexer {
            constructor(source) {
                this.source = source;
                this.tokens = [];
                this.start = 0;    // Start of the current token
                this.current = 0;  // Current character being scanned
            }

            tokenize() {
                while (!this.isAtEnd()) {
                    this.start = this.current;
                    this.scanToken();
                }
                this.tokens.push({ type: TOKEN_TYPES.EOF, value: "" });
                return this.tokens;
            }

            isAtEnd() {
                return this.current >= this.source.length;
            }

            scanToken() {
                const c = this.advance();
                switch (c) {
                    // Single-character tokens
                    case '(': this.addToken(TOKEN_TYPES.L_PAREN); break;
                    case ')': this.addToken(TOKEN_TYPES.R_PAREN); break;
                    case '{': this.addToken(TOKEN_TYPES.L_BRACE); break;
                    case '}': this.addToken(TOKEN_TYPES.R_BRACE); break;
                    case ',': this.addToken(TOKEN_TYPES.COMMA); break;
                    case '+': this.addToken(TOKEN_TYPES.PLUS); break;
                    case '-': this.addToken(TOKEN_TYPES.MINUS); break;
                    case '*': this.addToken(TOKEN_TYPES.STAR); break;
                    case ';': this.addToken(TOKEN_TYPES.SEMICOLON); break;

                    // Multi-character tokens
                    case '=':
                        this.addToken(this.match('=') ? TOKEN_TYPES.EQUAL_EQUAL : TOKEN_TYPES.EQUAL);
                        break;
                    case '!':
                        this.addToken(this.match('=') ? TOKEN_TYPES.BANG_EQUAL : TOKEN_TYPES.BANG);
                        break;
                    case '<':
                        this.addToken(this.match('=') ? TOKEN_TYPES.LESS_EQUAL : TOKEN_TYPES.LESS);
                        break;
                    case '>':
                        this.addToken(this.match('=') ? TOKEN_TYPES.GREATER_EQUAL : TOKEN_TYPES.GREATER);
                        break;
                    case '&':
                        if (this.match('&')) {
                            this.addToken(TOKEN_TYPES.AND);
                        } else {
                            throw new Error(`Unexpected character: ${c} at position ${this.start}`);
                        }
                        break;
                    case '|':
                        if (this.match('|')) {
                            this.addToken(TOKEN_TYPES.OR);
                        } else {
                            throw new Error(`Unexpected character: ${c} at position ${this.start}`);
                        }
                        break;
                    
                    case '/':
                        if (this.match('/')) {
                            // A comment goes until the end of the line.
                            while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
                        } else {
                            this.addToken(TOKEN_TYPES.SLASH);
                        }
                        break;

                    // Ignore whitespace
                    case ' ':
                    case '\r':
                    case '\t':
                    case '\n':
                        break;

                    // Strings
                    case '"':
                        this.string();
                        break;

                    default:
                        if (this.isDigit(c)) {
                            this.number();
                        } else if (this.isAlpha(c)) {
                            this.identifier();
                        } else {
                            throw new Error(`Unexpected character: ${c} at position ${this.start}`);
                        }
                        break;
                }
            }

            advance() {
                return this.source.charAt(this.current++);
            }

            addToken(type, value = null) {
                const text = this.source.substring(this.start, this.current);
                this.tokens.push({ type, value: value !== null ? value : text });
            }

            match(expected) {
                if (this.isAtEnd()) return false;
                if (this.source.charAt(this.current) != expected) return false;
                this.current++;
                return true;
            }

            peek() {
                if (this.isAtEnd()) return '\0';
                return this.source.charAt(this.current);
            }

            string() {
                while (this.peek() != '"' && !this.isAtEnd()) {
                    this.advance();
                }
                if (this.isAtEnd()) {
                    throw new Error(`Unterminated string at position ${this.start}`);
                }
                this.advance(); // The closing "
                const value = this.source.substring(this.start + 1, this.current - 1);
                this.addToken(TOKEN_TYPES.STRING, value);
            }

            number() {
                while (this.isDigit(this.peek())) this.advance();
                if (this.peek() == '.' && this.isDigit(this.peekNext())) {
                    this.advance(); // Consume the "."
                    while (this.isDigit(this.peek())) this.advance();
                }
                const value = parseFloat(this.source.substring(this.start, this.current));
                this.addToken(TOKEN_TYPES.NUMBER, value);
            }

            identifier() {
                while (this.isAlphaNumeric(this.peek())) this.advance();
                const text = this.source.substring(this.start, this.current);
                const type = KEYWORDS[text] || TOKEN_TYPES.IDENTIFIER;
                this.addToken(type, text);
            }
            
            peekNext() {
                if (this.current + 1 >= this.source.length) return '\0';
                return this.source.charAt(this.current + 1);
            }

            isDigit(c) {
                return c >= '0' && c <= '9';
            }

            isAlpha(c) {
                return (c >= 'a' && c <= 'z') ||
                       (c >= 'A' && c <= 'Z') ||
                       c == '_';
            }

            isAlphaNumeric(c) {
                return this.isAlpha(c) || this.isDigit(c);
            }
        }

        // --- 3. PARSER (AST GENERATOR) ---
        // Takes an array of tokens and builds an Abstract Syntax Tree (AST).
        // This is a "Recursive Descent Parser".
        //
        // Grammar:
        // program      -> statement* EOF
        // statement    -> varDeclaration | printStatement | ifStatement | blockStatement | exprStatement
        // varDeclaration -> "ye" IDENTIFIER ("=" expression)?
        // printStatement -> "bol" expression+
        // ifStatement  -> "agar" "(" expression ")" statement ("toh" statement)?
        // blockStatement -> "{" statement* "}"
        // exprStatement-> expression
        // expression   -> assignment
        // assignment   -> IDENTIFIER "=" assignment | logicalOr
        // logicalOr    -> logicalAnd ("||" logicalAnd)*
        // logicalAnd   -> equality ("&&" equality)*
        // equality     -> comparison (("!=" | "==") comparison)*
        // comparison   -> term ((">" | ">=" | "<" | "<=") term)*
        // term         -> factor (("+" | "-") factor)*
        // factor       -> unary (("*" | "/") unary)*
        // unary        -> ("!" | "-") unary | primary
        // primary      -> NUMBER | STRING | IDENTIFIER | "(" expression ")"

        class Parser {
            constructor(tokens) {
                this.tokens = tokens;
                this.current = 0;
            }

            parse() {
                const statements = [];
                while (!this.isAtEnd()) {
                    try {
                        statements.push(this.statement());
                    } catch (e) {
                        // In a real compiler, we'd synchronize and continue parsing.
                        // For this simple one, we can just re-throw.
                        throw e;
                    }
                }
                return { type: 'Program', body: statements };
            }

            // --- Statement Parsers ---
            
            statement() {
                if (this.match(TOKEN_TYPES.YE)) return this.varDeclaration();
                if (this.match(TOKEN_TYPES.BOL)) return this.printStatement();
                if (this.match(TOKEN_TYPES.AGAR)) return this.ifStatement();
                if (this.match(TOKEN_TYPES.L_BRACE)) return this.blockStatement();
                return this.expressionStatement();
            }

            varDeclaration() {
                const name = this.consume(TOKEN_TYPES.IDENTIFIER, "Expect variable name after 'ye'.");
                let value = null;
                if (this.match(TOKEN_TYPES.EQUAL)) {
                    value = this.expression();
                }
                return { type: 'VariableDeclaration', name: name.value, value };
            }

            printStatement() {
                // Allow multiple expressions, e.g., bol "Hello", name
                const expressions = [this.expression()];
                while (this.match(TOKEN_TYPES.COMMA)) {
                    expressions.push(this.expression());
                }
                return { type: 'PrintStatement', expressions };
            }

            ifStatement() {
                this.consume(TOKEN_TYPES.L_PAREN, "Expect '(' after 'agar'.");
                const condition = this.expression();
                this.consume(TOKEN_TYPES.R_PAREN, "Expect ')' after if condition.");
                
                const consequent = this.statement();
                let alternate = null;
                if (this.match(TOKEN_TYPES.TOH)) {
                    alternate = this.statement();
                }
                
                return { type: 'IfStatement', condition, consequent, alternate };
            }
            
            blockStatement() {
                const statements = [];
                while (!this.check(TOKEN_TYPES.R_BRACE) && !this.isAtEnd()) {
                    statements.push(this.statement());
                }
                this.consume(TOKEN_TYPES.R_BRACE, "Expect '}' after block.");
                return { type: 'BlockStatement', body: statements };
            }

            expressionStatement() {
                const expr = this.expression();
                return { type: 'ExpressionStatement', expression: expr };
            }

            // --- Expression Parsers (by precedence) ---
            
            expression() {
                return this.assignment();
            }

            assignment() {
                const expr = this.logicalOr(); // Left-hand side
                
                if (this.match(TOKEN_TYPES.EQUAL)) {
                    const value = this.assignment(); // Right-hand side is recursive
                    
                    if (expr.type === 'Identifier') {
                        return { type: 'AssignmentExpression', name: expr.name, value };
                    }
                    throw new Error("Invalid assignment target.");
                }
                
                return expr;
            }

            logicalOr() {
                let expr = this.logicalAnd();
                while (this.match(TOKEN_TYPES.OR)) {
                    const operator = this.previous().value;
                    const right = this.logicalAnd();
                    expr = { type: 'LogicalExpression', left: expr, operator, right };
                }
                return expr;
            }

            logicalAnd() {
                let expr = this.equality();
                while (this.match(TOKEN_TYPES.AND)) {
                    const operator = this.previous().value;
                    const right = this.equality();
                    expr = { type: 'LogicalExpression', left: expr, operator, right };
                }
                return expr;
            }

            equality() {
                let expr = this.comparison();
                while (this.match(TOKEN_TYPES.EQUAL_EQUAL, TOKEN_TYPES.BANG_EQUAL)) {
                    const operator = this.previous().value;
                    const right = this.comparison();
                    expr = { type: 'BinaryExpression', left: expr, operator, right };
                }
                return expr;
            }

            comparison() {
                let expr = this.term();
                while (this.match(TOKEN_TYPES.GREATER, TOKEN_TYPES.GREATER_EQUAL, TOKEN_TYPES.LESS, TOKEN_TYPES.LESS_EQUAL)) {
                    const operator = this.previous().value;
                    const right = this.term();
                    expr = { type: 'BinaryExpression', left: expr, operator, right };
                }
                return expr;
            }

            term() {
                let expr = this.factor();
                while (this.match(TOKEN_TYPES.PLUS, TOKEN_TYPES.MINUS)) {
                    const operator = this.previous().value;
                    const right = this.factor();
                    expr = { type: 'BinaryExpression', left: expr, operator, right };
                }
                return expr;
            }

            factor() {
                let expr = this.unary();
                while (this.match(TOKEN_TYPES.STAR, TOKEN_TYPES.SLASH)) {
                    const operator = this.previous().value;
                    const right = this.unary();
                    expr = { type: 'BinaryExpression', left: expr, operator, right };
                }
                return expr;
            }

            unary() {
                if (this.match(TOKEN_TYPES.BANG, TOKEN_TYPES.MINUS)) {
                    const operator = this.previous().value;
                    const right = this.unary();
                    return { type: 'UnaryExpression', operator, right };
                }
                return this.primary();
            }

            primary() {
                if (this.match(TOKEN_TYPES.NUMBER)) {
                    return { type: 'NumericLiteral', value: this.previous().value };
                }
                if (this.match(TOKEN_TYPES.STRING)) {
                    return { type: 'StringLiteral', value: this.previous().value };
                }
                if (this.match(TOKEN_TYPES.IDENTIFIER)) {
                    return { type: 'Identifier', name: this.previous().value };
                }
                if (this.match(TOKEN_TYPES.L_PAREN)) {
                    const expr = this.expression();
                    this.consume(TOKEN_TYPES.R_PAREN, "Expect ')' after expression.");
                    return { type: 'Grouping', expression: expr };
                }
                throw new Error(`Expect expression, got ${this.peek().type}`);
            }

            // --- Parser Helper Methods ---
            
            match(...types) {
                for (const type of types) {
                    if (this.check(type)) {
                        this.advance();
                        return true;
                    }
                }
                return false;
            }

            consume(type, message) {
                if (this.check(type)) return this.advance();
                throw new Error(message);
            }

            check(type) {
                if (this.isAtEnd()) return false;
                return this.peek().type == type;
            }

            advance() {
                if (!this.isAtEnd()) this.current++;
                return this.previous();
            }

            isAtEnd() {
                return this.peek().type == TOKEN_TYPES.EOF;
            }

            peek() {
                return this.tokens[this.current];
            }

            previous() {
                return this.tokens[this.current - 1];
            }
        }

        // --- 4. CODE GENERATOR (TRANSPILER) ---
        // Walks the AST and generates a JavaScript code string.
        class CodeGenerator {
            generate(programNode) {
                if (programNode.type !== 'Program') {
                    throw new Error("Invalid AST root: Expected 'Program'");
                }
                // We'll wrap the whole thing in a 'try...catch'
                // to send runtime errors to our output.
                let jsCode = "try {\n";
                jsCode += programNode.body.map(statement => this.visit(statement)).join('\n');
                jsCode += "\n} catch (e) {\n  __output.push(e.message);\n}";
                return jsCode;
            }

            visit(node) {
                switch (node.type) {
                    case 'VariableDeclaration':
                        return this.visitVariableDeclaration(node);
                    case 'PrintStatement':
                        return this.visitPrintStatement(node);
                    case 'IfStatement':
                        return this.visitIfStatement(node);
                    case 'BlockStatement':
                        return this.visitBlockStatement(node);
                    case 'ExpressionStatement':
                        return this.visitExpressionStatement(node);
                    case 'AssignmentExpression':
                        return this.visitAssignmentExpression(node);
                    case 'LogicalExpression':
                    case 'BinaryExpression':
                        return this.visitBinaryExpression(node);
                    case 'UnaryExpression':
                        return this.visitUnaryExpression(node);
                    case 'Grouping':
                        return `(${this.visit(node.expression)})`;
                    case 'NumericLiteral':
                        return node.value;
                    case 'StringLiteral':
                        // JSON.stringify handles escaping quotes, newlines, etc.
                        return JSON.stringify(node.value); 
                    case 'Identifier':
                        return node.name;
                    default:
                        throw new Error(`Unknown AST node type: ${node.type}`);
                }
            }

            visitVariableDeclaration(node) {
                const value = node.value ? this.visit(node.value) : 'null';
                // Using 'let' to allow reassignment.
                return `let ${node.name} = ${value};`;
            }

            visitPrintStatement(node) {
                // We'll have the generated code push to an `__output` array
                // instead of using console.log, so we can capture it.
                const args = node.expressions.map(expr => this.visit(expr)).join(', ');
                return `__output.push(${args});`;
            }
            
            visitIfStatement(node) {
                const condition = this.visit(node.condition);
                const consequent = this.visit(node.consequent);
                let js = `if (${condition}) ${consequent}`;
                if (node.alternate) {
                    js += ` else ${this.visit(node.alternate)}`;
                }
                return js;
            }

            visitBlockStatement(node) {
                const body = node.body.map(stmt => this.visit(stmt)).join('\n');
                return `{\n${body}\n}`;
            }

            visitExpressionStatement(node) {
                return `${this.visit(node.expression)};`;
            }

            visitAssignmentExpression(node) {
                return `${node.name} = ${this.visit(node.value)}`;
            }

            visitBinaryExpression(node) {
                const left = this.visit(node.left);
                const right = this.visit(node.right);
                return `(${left} ${node.operator} ${right})`;
            }

            visitUnaryExpression(node) {
                const right = this.visit(node.right);
                return `(${node.operator}${right})`;
            }
        }


        // --- 5. RUNNER ---
        // Main function to tie everything together.
        function runCode() {
            const code = document.getElementById('codeInput').value;
            const outputElement = document.getElementById('output');
            const jsElement = document.getElementById('generatedJs');

            // Clear previous outputs
            outputElement.textContent = '';
            jsElement.textContent = '';

            // This array will capture all `bol` outputs
            const __output = [];

            try {
                // 1. Lexer
                const lexer = new Lexer(code);
                const tokens = lexer.tokenize();
                
                // 2. Parser
                const parser = new Parser(tokens);
                const ast = parser.parse();

                // 3. Code Generator
                const generator = new CodeGenerator();
                const jsCode = generator.generate(ast);
                jsElement.textContent = jsCode; // Display the generated JS

                // 4. Run
                // We use `new Function` to run the code in a controlled
                // scope. We pass in our `__output` array so the
                // `__output.push()` calls in the generated code work.
                const runner = new Function('__output', jsCode);
                
                // Execute the generated code
                runner(__output);

                // Display the captured output
                outputElement.textContent = __output.map(line => 
                    Array.isArray(line) ? line.join(' ') : String(line)
                ).join('\n');
                outputElement.classList.remove('text-red-400');
                outputElement.classList.add('text-green-400');

            } catch (e) {
                // Display lexer, parser, or runtime errors
                outputElement.textContent = e.stack;
                outputElement.classList.remove('text-green-400');
                outputElement.classList.add('text-red-400');
            }
        }

        // Attach event listener to the button
        document.getElementById('runButton').addEventListener('click', runCode);
        
        // Run once on load to show the example
        runCode();
    </script>
</body>
</html>

