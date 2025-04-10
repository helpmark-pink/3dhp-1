class Slideshow {
    constructor() {
        this.slideshow = document.querySelector('.slideshow');
        this.slides = document.querySelectorAll('.slide');
        this.currentIndex = 0;
        this.touchStartX = 0;
        this.touchEndX = 0;

        // ナビゲーションボタン
        document.querySelector('.prev').addEventListener('click', () => this.prevSlide());
        document.querySelector('.next').addEventListener('click', () => this.nextSlide());

        // タッチイベント
        this.slideshow.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.slideshow.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // ドットナビゲーションの作成
        this.createDots();
        this.updateDots();
    }

    createDots() {
        const dotsContainer = document.querySelector('.dots');
        for (let i = 0; i < this.slides.length; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        const difference = this.touchStartX - this.touchEndX;
        
        if (Math.abs(difference) > 50) {
            if (difference > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateSlidePosition();
        this.updateDots();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.updateSlidePosition();
        this.updateDots();
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.updateSlidePosition();
        this.updateDots();
    }

    updateSlidePosition() {
        this.slideshow.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }
}

// スライドショーの初期化
document.addEventListener('DOMContentLoaded', () => {
    new Slideshow();
});