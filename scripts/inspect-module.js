const pkg = require('yahoo-finance2');

console.log('Type of package:', typeof pkg);
console.log('Keys of package:', Object.keys(pkg));
if (pkg.default) {
    console.log('Has default export');
    console.log('Keys of default:', Object.keys(pkg.default));
    console.log('Type of quote in default:', typeof pkg.default.quote);
} else {
    console.log('No default export');
}

if (pkg.quote) {
    console.log('Has named quote export');
}

console.log('Full package:', pkg);
