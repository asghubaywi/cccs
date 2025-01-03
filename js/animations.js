// استيراد GSAP
import gsap from 'https://cdn.skypack.dev/gsap';

// تهيئة التحريكات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحريك العناصر عند التحميل
    gsap.from('.container', {
        duration: 1,
        opacity: 0,
        y: 30,
        ease: 'power3.out'
    });

    // تحريك العناوين
    gsap.from('h1, h2', {
        duration: 1.2,
        opacity: 0,
        y: 20,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // تحريك البطاقات
    gsap.from('.card', {
        duration: 0.8,
        opacity: 0,
        y: 40,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // تحريك الأزرار
    gsap.from('.btn', {
        duration: 0.6,
        scale: 0.8,
        opacity: 0,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    });
});

// تأثير التحويم للبطاقات
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            duration: 0.3,
            y: -5,
            scale: 1.02,
            ease: 'power2.out'
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            duration: 0.3,
            y: 0,
            scale: 1,
            ease: 'power2.out'
        });
    });
});

// تأثير النقر على الأزرار
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        gsap.to(button, {
            duration: 0.1,
            scale: 0.95,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    });
});

// تبديل الوضع الليلي
const toggleTheme = () => {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.setAttribute('data-theme', 'light');
        gsap.to('body', {
            backgroundColor: '#f8f9fa',
            color: '#2d3436',
            duration: 0.5
        });
    } else {
        body.setAttribute('data-theme', 'dark');
        gsap.to('body', {
            backgroundColor: '#0f0f0f',
            color: '#ffffff',
            duration: 0.5
        });
    }
};
