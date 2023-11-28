class Register {
    element;
    content;

    constructor(elementId) {
        this.element = document.querySelector(elementId);
        this.content = this.element.querySelector(".content") || null;
    }

    activate() {
        this.element.classList.add("active");
    }

    deactivate() {
        this.element.classList.remove("active");
    }

    fadeIn() {
        this.content.style.opacity = 1;
    }

    fadeOut() {
        this.content.style.opacity = 0;
    }

    setContent(content) {
        this.content.textContent = content;
    }
}

class App {
    //numbers
    pos1 = 0;
    pos2 = 0;
    offset = 0;
    frame = 0;

    //registers
    posPageDir;
    posLevel2;
    frame;
    finalAddress;
    offsetRegister;

    running = false;

    init() {
        this.ptbr = new Register("#ptbr");
        this.posPageDir = new Register("#position-dp");
        this.frameRegister = new Register("#frame");
        this.posLevel2 = new Register("#position-l2");
        this.finalAddress = new Register("#final");
        this.offsetRegister = new Register("#offset");

        //setting up the click listener
        document
            .querySelector("#address-container")
            .addEventListener("click", (e) => {
                if (e.target.classList.contains("request-addr")) {
                    if (!this.running) this.start(e.target.textContent);
                }
            });
    }

    async reset() {
        this.posPageDir.setContent("-");
        this.posLevel2.setContent("-");
        this.frameRegister.setContent("-");
        this.finalAddress.setContent("-");
        this.offsetRegister.setContent("-");

        const results = Array.from(document.querySelectorAll(".result"));
        for (let result of results) result.classList.remove("result-active");
    }

    async start(logicalAddr) {
        this.running = true;
        await this.reset();
        await this.delay(300);

        //setting up position in page directory
        this.pos1 = parseInt(logicalAddr.replace("#", ""), 16) >> 22;
        await this.step(
            this.posPageDir,
            this.pos1.toString(2).padStart(10, "0")
        );

        //setting up position in layer 2
        this.pos2 =
            (parseInt(logicalAddr.replace("#", ""), 16) >> 12) &
            0b00000000001111111111;

        await this.step(
            this.posLevel2,
            this.pos2.toString(2).padStart(10, "0")
        );

        //setting up the offset
        this.offset =
            parseInt(logicalAddr.replace("#", ""), 16) &
            0b00000000000000000000111111111111;
        this.offsetRegister.activate();
        await this.delay(500);
        this.offsetRegister.setContent(
            this.offset.toString(2).padStart(12, "0")
        );
        await this.delay(1000);
        this.offsetRegister.setContent(this.offset.toString(16));
        await this.delay(500);
        this.offsetRegister.deactivate();

        //highlightin ptbr
        this.ptbr.activate();
        await this.delay(1000);
        this.ptbr.deactivate();

        //highlighing page directory
        const pdAddrs = Array.from(document.querySelectorAll(".pd"));

        this.posPageDir.activate();
        for (let i = 0; i <= this.pos1; i++) {
            pdAddrs[i].classList.add("pd-active");
            await this.delay(1000);

            if (i != this.pos1) pdAddrs[i].classList.remove("pd-active");
        }
        await this.delay(1000);
        pdAddrs[this.pos1].classList.remove("pd-active");
        this.posPageDir.deactivate();

        //highlighting level 2
        const l2Addrs = Array.from(document.querySelectorAll(".l2"));

        this.posLevel2.activate();
        for (let i = 0; i <= this.pos2; i++) {
            l2Addrs[i].classList.add("l2-active");
            await this.delay(1000);

            if (i != this.pos2) l2Addrs[i].classList.remove("l2-active");
        }
        await this.delay(1000);
        l2Addrs[this.pos2].classList.remove("l2-active");
        this.posLevel2.deactivate();

        this.frame = parseInt(
            l2Addrs[this.pos2]
                .querySelector("span")
                .textContent.replace("#", ""),
            16
        );

        this.frameRegister.activate();
        this.offsetRegister.activate();
        this.frameRegister.setContent(this.frame.toString(16));
        await this.delay(2000);

        this.finalAddress.setContent(
            "#" +
                this.frame.toString(16).split("").slice(0, 5).join("") +
                this.offset.toString(16)
        );

        this.frameRegister.deactivate();
        this.offsetRegister.deactivate();

        this.finalAddress.activate();
        await this.delay(1000);

        const results = Array.from(document.querySelectorAll(".result"));

        for (let result of results) {
            if (
                result.firstChild.textContent.toLocaleLowerCase().trim() ===
                (
                    "#" +
                    this.frame.toString(16).split("").slice(0, 5).join("") +
                    this.offset.toString(16)
                ).toLocaleLowerCase()
            ) {
                result.classList.add("result-active");
            }
        }

        this.finalAddress.deactivate();

        this.running = false;
    }

    async step(register, binary) {
        register.activate();
        await this.delay(500);
        register.setContent(binary);
        await this.delay(1000);
        register.setContent(parseInt(binary, 2));
        await this.delay(500);
        register.deactivate();
    }

    async delay(miliseocnds) {
        return new Promise((resolve) => setTimeout(resolve, miliseocnds));
    }
}

window.addEventListener("load", new App().init());
