// ── Contact detail reveal — bot mitigation ───────────────────
// Email and Instagram are never written in plain text in the HTML
// or this file. They are assembled at runtime from split parts,
// so scrapers reading the source can't trivially harvest them.

// Email: Krisrk2009 @ gmail.com
var eParts = ['Kris', 'rk', '2009', '\u0040', 'gma', 'il', '.com'];

// Instagram handle: krkstrike
var igParts = ['krk', 'str', 'ike'];

function revealEmail() {
    var display = document.getElementById('emailDisplay');
    var btn     = document.getElementById('revealEmailBtn');
    if (!display || !btn) return;

    var address = eParts.join('');
    display.innerHTML =
        '<a href="mailto:' + address + '" class="ContactLink">' + address + '</a>';
    display.style.display = 'inline-block';
    btn.style.display = 'none';
}

function revealInstagram() {
    var display = document.getElementById('igDisplay');
    var btn     = document.getElementById('revealIgBtn');
    if (!display || !btn) return;

    var handle = igParts.join('');
    display.innerHTML =
        '<a href="https://www.instagram.com/' + handle + '/" target="_blank" rel="noopener noreferrer" class="ContactLink">@' + handle + ' &#8599;</a>';
    display.style.display = 'inline-block';
    btn.style.display = 'none';
}