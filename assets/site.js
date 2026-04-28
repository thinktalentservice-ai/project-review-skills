(function () {
    function setResult(message) {
        var node = document.getElementById("copy-result");
        if (node) {
            node.textContent = message;
        }
    }

    async function copyText(value) {
        try {
            await navigator.clipboard.writeText(value);
            setResult("Command copied.");
        } catch (error) {
            setResult("Clipboard blocked. Copy manually from the command block.");
        }
    }

    var copyButtons = document.querySelectorAll("[data-copy]");
    copyButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var value = button.getAttribute("data-copy");
            if (value) {
                copyText(value);
            }
        });
    });
})();
