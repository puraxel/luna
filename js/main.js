if (/Mobi|Android/i.test(navigator.userAgent)) {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    header.style.top = window.scrollY + 'px';
  });
}

document.addEventListener('DOMContentLoaded', () => {

    /* ===========================
       1. Header Scroll, Footer, GoToTop, Popups, Parallax
    =========================== */
    const header = document.querySelector('header');
    const popups = document.querySelectorAll('.popupBtn');
    const scrollBtn = document.getElementById('scrollToTop');
    const parallaxSections = document.querySelectorAll('section[data-parallax]');

    function handleScroll() {
        // Scroll position for mobile/all browsers
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        // header toggle (minimal processing without conflict)
        if(header) {
            if(scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }

        // popup toggle
        popups.forEach(p => {
            if(scrollY > 100) p.classList.add('show');
            else p.classList.remove('show');
        });

        // Go to Top toggle
        if(scrollBtn) {
            if(scrollY > 300) scrollBtn.classList.add('show');
            else scrollBtn.classList.remove('show');
        }

        // parallax (independent processing of transform by section)
        parallaxSections.forEach(section => {
            const speed = 0.5;
            // Applied based on the section's own offsetTop
            const offset = section.offsetTop;
            section.style.backgroundPosition = `center ${-(scrollY - offset) * speed}px`;
        });
    }

    window.addEventListener('scroll', handleScroll);

    // Also applies during initial loading
    window.addEventListener('load', () => requestAnimationFrame(handleScroll));
    setTimeout(handleScroll, 100);
    // Go to Top
    if(scrollBtn){
        scrollBtn.addEventListener('click', e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // don't show for a day
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.parentElement.style.display = 'none');
    });
    document.querySelectorAll('.hide-today-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const popup = btn.parentElement;
            const popupId = popup.id;
            document.cookie = `${popupId}=hidden; path=/; max-age=${60*60*24}`;
            popup.style.display = 'none';
        });
    });

    function getCookie(name){
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if(parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    window.addEventListener('load', () => {
        popups.forEach(popup => {
            const popupId = popup.id;
            if(getCookie(popupId) === 'hidden') popup.style.display = 'none';
        });
    });
/* ---------------------------
  Activate nav
--------------------------- */
const navLinks = document.querySelectorAll('header nav a');

// Select only sections with id
const sectionsWithId = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href').substring(1) === id);
      });
    }
  });
}, { threshold: 0.1 }); // When you get near the center of the screen

sectionsWithId.forEach(sec => navObserver.observe(sec));

    /* ===========================
       2. Hero Text Animation (after Load)
    =========================== */
    const heroTitle = document.querySelector('.hero h1');
    if(heroTitle){
        heroTitle.innerHTML = heroTitle.textContent
            .split('')
            .map(c => `<span style="display:inline-block; transform:translateY(40px); transition:0.5s;">${c}</span>`)
            .join('');

        const spans = heroTitle.querySelectorAll('span');
        window.addEventListener('load', () => {
            spans.forEach((s,i)=>setTimeout(()=>{ s.style.transform='translateY(0)'; }, i*50));
        });
    }

   /* ===========================
   Hero Slider (loop + Drag + Auto)
=========================== */
const sliderEl = document.querySelector('.hero_slider');
const heroSlidesRow = document.querySelector('.hero_slides');
const heroSlideElems = document.querySelectorAll('.hero_slide');
const heroPrevBtn = document.querySelector('.hero_prev');
const heroNextBtn = document.querySelector('.hero_next');

if(sliderEl && heroSlidesRow && heroSlideElems.length>0 && heroPrevBtn && heroNextBtn){
    let heroIndex = 0;
    let heroSlideWidth = sliderEl.offsetWidth;
    const heroTotal = heroSlideElems.length;
    let heroAutoTimer;
    let isTransitioning = false;

    // 1. Duplicate slide (loop)
    const firstClone = heroSlideElems[0].cloneNode(true);
    const lastClone = heroSlideElems[heroTotal-1].cloneNode(true);
    heroSlidesRow.appendChild(firstClone);
    heroSlidesRow.insertBefore(lastClone, heroSlideElems[0]);
    heroIndex = 1; // The actual first slide is index 1

    heroSlidesRow.style.transform = `translateX(${-heroIndex*heroSlideWidth}px)`;

    // 2. Slide move function
    const moveToSlide = (targetIndex)=>{
        if(isTransitioning) return; // Ignore if moving
        isTransitioning = true;

        heroSlidesRow.style.transition = 'transform 0.6s ease-in-out';
        heroSlidesRow.style.transform = `translateX(${-targetIndex*heroSlideWidth}px)`;
        heroIndex = targetIndex;
    };

    // 3. transitionend Handling infinite loops with events
    heroSlidesRow.addEventListener('transitionend', ()=>{
        if(heroIndex === 0){ // Jump from last clone to first slide
            heroSlidesRow.style.transition = 'none';
            heroIndex = heroTotal;
            heroSlidesRow.style.transform = `translateX(${-heroIndex*heroSlideWidth}px)`;
        }
        if(heroIndex === heroTotal + 1){ // Jump from the first clone to the last slide
            heroSlidesRow.style.transition = 'none';
            heroIndex = 1;
            heroSlidesRow.style.transform = `translateX(${-heroIndex*heroSlideWidth}px)`;
        }
        isTransitioning = false;
    });

    // 4. Click the button
    heroPrevBtn.addEventListener('click', ()=>moveToSlide(heroIndex-1));
    heroNextBtn.addEventListener('click', ()=>moveToSlide(heroIndex+1));

    // 5. Auto slide
    const startAuto = ()=>{
        clearInterval(heroAutoTimer);
        heroAutoTimer = setInterval(()=>moveToSlide(heroIndex+1),10000);
    };
    startAuto();
    sliderEl.addEventListener('mouseenter', ()=>clearInterval(heroAutoTimer));
    sliderEl.addEventListener('mouseleave', startAuto);

    // 6. Drag
    let startX=0, currentX=0, isDragging=false, initialTranslate=0;

    const setTranslate = (val)=>{ heroSlidesRow.style.transition='none'; heroSlidesRow.style.transform=`translateX(${val}px)`; };
    const resetTranslate = ()=>{ heroSlidesRow.style.transition='transform 0.6s ease-in-out'; heroSlidesRow.style.transform=`translateX(${-heroIndex*heroSlideWidth}px)`; };

    const dragStart = x=>{
        isDragging=true;
        startX=x;
        initialTranslate=-heroIndex*heroSlideWidth;
        heroSlidesRow.style.cursor='grabbing';
    };
    const dragMove = x=>{
        if(!isDragging) return;
        currentX=x;
        setTranslate(initialTranslate + (currentX-startX));
    };
    const dragEnd = ()=>{
        if(!isDragging) return;
        isDragging=false;
        heroSlidesRow.style.cursor='grab';
        const diff = currentX - startX;
        if(Math.abs(diff) > heroSlideWidth/4){
            moveToSlide(diff>0 ? heroIndex-1 : heroIndex+1);
        } else {
            resetTranslate();
        }
    };

    sliderEl.addEventListener('mousedown', e=>{
        e.preventDefault();
        dragStart(e.clientX);
        const onMove = e2=>dragMove(e2.clientX);
        const onUp = ()=>{
            dragEnd();
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    sliderEl.addEventListener('touchstart', e=>dragStart(e.touches[0].clientX));
    sliderEl.addEventListener('touchmove', e=>dragMove(e.touches[0].clientX));
    sliderEl.addEventListener('touchend', dragEnd);

    // 7. Resize
    window.addEventListener('resize', ()=>{
        heroSlideWidth = sliderEl.offsetWidth;
        heroSlidesRow.style.transition='none';
        heroSlidesRow.style.transform = `translateX(${-heroIndex*heroSlideWidth}px)`;
    });
}

    /* ===========================
       4. Small Products Carousel
    =========================== */
    const track = document.querySelector('.carousel-track');
    if(track){
        const slides = Array.from(track.children);
        const prevBtn = document.querySelector('.carousel-btn.prev');
        const nextBtn = document.querySelector('.carousel-btn.next');
        let index = 0;

        const updateCarousel = ()=>{ 
            track.style.transform = `translateX(-${index*100}%)`;
            slides.forEach((slide,i)=>slide.classList.toggle('active',i===index));
        };

        prevBtn.addEventListener('click', ()=>{ index=(index-1+slides.length)%slides.length; updateCarousel(); });
        nextBtn.addEventListener('click', ()=>{ index=(index+1)%slides.length; updateCarousel(); });

        // Drag
        let startX=0, isDown=false;
        track.addEventListener('pointerdown', e=>{ isDown=true; startX=e.clientX; track.style.transition='none'; });
        track.addEventListener('pointermove', e=>{ if(!isDown) return; const dx=e.clientX-startX; track.style.transform=`translateX(${-index*100 + dx/track.offsetWidth*100}%)`; });
        track.addEventListener('pointerup', e=>{
            if(!isDown) return; isDown=false; const dx=e.clientX-startX; track.style.transition='transform 0.6s ease';
            if(dx<-50) index=(index+1)%slides.length;
            else if(dx>50) index=(index-1+slides.length)%slides.length;
            updateCarousel();
        });

        setInterval(()=>nextBtn.click(),4000);
    }

/* ===========================
   5. FAQ Accordion (Multi-opening possible)
=========================== */
const questions = document.querySelectorAll('.faq-question');
const closeAllBtn = document.getElementById('close-all');
const openAllBtn = document.getElementById('open-all'); // Newly added button

function updateBtnVisibility() {
    const anyOpen = Array.from(questions).some(q => q.classList.contains('active'));
    const allOpen = Array.from(questions).every(q => q.classList.contains('active'));

    // Close All button: Only visible when at least one question is open
    if (closeAllBtn) closeAllBtn.style.display = anyOpen ? 'inline-block' : 'none';

    // Open All button: Only appears when there is one or more questions and none of them are open.
    if (openAllBtn) openAllBtn.style.display = (questions.length > 0 && !allOpen) ? 'inline-block' : 'none';
}

if (questions.length > 0) {
    questions.forEach(q => {
        q.addEventListener('click', () => {
            const answer = q.nextElementSibling;
            const isOpen = q.classList.contains('active');

            if (isOpen) {
                q.classList.remove('active');
                answer.style.maxHeight = null;
            } else {
                q.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }

            updateBtnVisibility(); // Update button state after click
        });
    });
}

// Close all FAQs
if (closeAllBtn) {
    closeAllBtn.addEventListener('click', () => {
        questions.forEach(q => {
            q.classList.remove('active');
            q.nextElementSibling.style.maxHeight = null;
        });
        updateBtnVisibility();
    });
}

// Open all FAQs
if (openAllBtn) {
    openAllBtn.addEventListener('click', () => {
        questions.forEach(q => {
            q.classList.add('active');
            q.nextElementSibling.style.maxHeight = q.nextElementSibling.scrollHeight + 'px';
        });
        updateBtnVisibility();
    });
}

// Update the display of the initial state button
updateBtnVisibility();


    /* ===========================
       6. Timeline Fade-in
    =========================== */
    const timelineItems = document.querySelectorAll('.timeline-item');
    if(timelineItems.length>0){
        timelineItems.forEach(item=>{
            const obs = new IntersectionObserver(entries=>{
                if(entries[0].isIntersecting){
                    item.style.transform='translateX(0)';
                    item.style.opacity='1';
                    obs.unobserve(item);
                }
            },{threshold:0.3});
            item.style.transform='translateX(-50px)';
            item.style.opacity='0';
            obs.observe(item);
        });
    }

    /* ===========================
       7. Stats Count-up
    =========================== */
    const counters = document.querySelectorAll('.count');
    const speed = 50;
    if(counters.length>0){
        counters.forEach(counter=>{
            const updateCount = ()=>{
                const target = parseFloat(counter.dataset.target);
                const count = parseFloat(counter.innerText);
                const increment = target / 30;
                if(count<target){
                    counter.innerText = (count+increment).toFixed(1);
                    setTimeout(updateCount,speed);
                }else{
                    counter.innerText = target;
                }
            };
            const obs = new IntersectionObserver(entries=>{
                if(entries[0].isIntersecting){
                    updateCount();
                    obs.unobserve(counter);
                }
            },{threshold:0.5});
            obs.observe(counter);
        });
    }

    /* ===========================
       8. Scroll Animate & Parallax Sections
    =========================== */
    const sections = document.querySelectorAll('section:not(.c_row)');
    const rows = document.querySelectorAll('.c_row');

    if(sections.length>0 || rows.length>0){
        const observer = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(!entry.isIntersecting) return;
                const el = entry.target;
                if(el.classList.contains('c_row')){
                    el.classList.add(el.classList.contains('left') ? 'fade-in-left' : 'fade-in-right');
                } else {
                    el.classList.add('animate');
                }
            });
        },{threshold:0.2});

        sections.forEach(sec=>observer.observe(sec));
        rows.forEach((row,index)=>{
            row.classList.add(index%2===0 ? 'left' : 'right');
            observer.observe(row);
        });
    }
	
	/* ===========================
   9. Lcarousel (Large Horizontal Carousel)
=========================== */
(function(){
    const Lcarousel = document.querySelector('.Lcarousel');
    if(!Lcarousel) return;

    const viewport = Lcarousel.querySelector('.viewport');
    const track = Lcarousel.querySelector('.track');
    const prevBtn = Lcarousel.querySelector('.Lnav.prev');
    const nextBtn = Lcarousel.querySelector('.Lnav.next');
    const dotsContainer = Lcarousel.querySelector('.dots');

    let slides = Array.from(track.children);
    const originalCount = slides.length;

    const TRANSITION_MS = 400;
    const DRAG_SPEED = 0.9;
    const THRESHOLD_RATIO_PC = 0.2;
    const THRESHOLD_RATIO_MOBILE = 0.1;

    let cloneCount = 0, index = 0, gap = 0, slideWidth = 0;
    const root = document.documentElement;

    const getVisible = ()=> parseFloat(getComputedStyle(root).getPropertyValue('--visible')) || 3.3333;
    const getCloneCount = ()=> Math.max(4, Math.ceil(getVisible())+1);

    const setTransition = on => { track.style.transition = on ? `transform ${TRANSITION_MS}ms ease` : 'none'; };

    const measure = ()=>{
        const slideEl = track.querySelector('.slide');
        if(!slideEl) return;
        const styles = getComputedStyle(track);
        gap = parseFloat(styles.columnGap || styles.gap) || 0;
        slideWidth = slideEl.getBoundingClientRect().width + gap;
    };

    const goToIndex = (i, animate=true)=>{
        setTransition(animate);
        index=i;
        track.style.transform = `translateX(${-index*slideWidth}px)`;
        updateDots();
    };

    const snapIfLoopEdge = ()=>{
        const firstReal=cloneCount;
        const lastRealStart=cloneCount+originalCount-1;
        if(index>lastRealStart) goToIndex(index-originalCount,false);
        else if(index<firstReal) goToIndex(index+originalCount,false);
    };

    const rebuild = ()=>{
        Array.from(track.querySelectorAll('.slide.__clone')).forEach(n=>n.remove());
        slides = Array.from(track.querySelectorAll('.slide')).filter(el=>!el.classList.contains('__clone'));
        cloneCount = getCloneCount();

        const firstClones = slides.slice(0,cloneCount).map(n=>n.cloneNode(true));
        const lastClones = slides.slice(-cloneCount).map(n=>n.cloneNode(true));

        firstClones.forEach(n=>{ n.classList.add('__clone'); track.appendChild(n); });
        lastClones.forEach(n=>{ n.classList.add('__clone'); track.insertBefore(n, track.firstChild); });

        measure();
        requestAnimationFrame(()=>{ goToIndex(cloneCount,false); });
        createDots();
    };

    const next = ()=>goToIndex(index+1);
    const prev = ()=>goToIndex(index-1);

    if(prevBtn) prevBtn.addEventListener('click', prev);
    if(nextBtn) nextBtn.addEventListener('click', next);

    /* Drag */
    let isDown=false, startX=0, startIndex=0, startTransform=0;
    const getCurrentTranslate = ()=> {
        const m=/translateX\((-?\d+(?:\.\d+)?)px\)/.exec(track.style.transform);
        return m?parseFloat(m[1]):0;
    };
    const onDown = e=>{
        e.preventDefault();
        isDown=true;
        startX=e.clientX??e.touches?.[0]?.clientX??0;
        startIndex=index;
        startTransform=getCurrentTranslate();
        setTransition(false);
    };
    const onMove = e=>{
        if(!isDown) return;
        const x = e.clientX??e.touches?.[0]?.clientX??0;
        const dx = x-startX;
        track.style.transform = `translateX(${startTransform+dx*DRAG_SPEED}px)`;
    };
    const onUp = e=>{
        if(!isDown) return;
        isDown=false;
        const endX = e.clientX??e.changedTouches?.[0]?.clientX??startX;
        const dx = endX-startX;
        const isMobile = window.innerWidth<=768;
        const threshold = slideWidth*(isMobile?THRESHOLD_RATIO_MOBILE:THRESHOLD_RATIO_PC);
        setTransition(true);
        if(Math.abs(dx)>5){
            const link = e.target.closest('a');
            if(link) e.preventDefault();
        }
        if(dx<-threshold) goToIndex(startIndex+1,true);
        else if(dx>threshold) goToIndex(startIndex-1,true);
        else goToIndex(startIndex,true);
    };

    Lcarousel.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', e=>{ if(isDown) onMove(e); });
    window.addEventListener('pointerup', e=>{ if(isDown) onUp(e); });
    Lcarousel.addEventListener('touchstart', onDown);
    window.addEventListener('touchmove', e=>{ if(isDown) onMove(e); });
    window.addEventListener('touchend', e=>{ if(isDown) onUp(e); });
    track.addEventListener('transitionend', snapIfLoopEdge);

    const onResize = ()=>{
        const currentRealOffset=(index-cloneCount+originalCount)%originalCount;
        rebuild();
        requestAnimationFrame(()=>{ goToIndex(cloneCount+currentRealOffset,false); });
    };
    window.addEventListener('resize', onResize);

    /* Dots */
    const createDots = ()=>{
        if(!dotsContainer) return;
        dotsContainer.innerHTML='';
        for(let i=0;i<originalCount;i++){
            const dot=document.createElement('div');
            dot.className='dot';
            dot.addEventListener('click', ()=>goToIndex(cloneCount+i));
            dotsContainer.appendChild(dot);
        }
        updateDots();
    };
    const updateDots = ()=>{
        if(!dotsContainer) return;
        const realIndex=(index-cloneCount+originalCount)%originalCount;
        dotsContainer.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active', i===realIndex));
    };

    /* AutoPlay */
    let autoPlayTimer;
    const startAutoPlay = ()=>{ stopAutoPlay(); autoPlayTimer=setInterval(next,3000); };
    const stopAutoPlay = ()=>clearInterval(autoPlayTimer);
    Lcarousel.addEventListener('mouseenter', stopAutoPlay);
    Lcarousel.addEventListener('mouseleave', startAutoPlay);

    rebuild();
    startAutoPlay();

})();

	/* ===========================
  10. testimonials (Large Horizontal Carousel)
=========================== */
(function(){
    const testimonials = document.querySelector('#testimonials .slides');
    if(!testimonials) return;

    const slides = Array.from(testimonials.children);
    const total = slides.length;
    let index = 0;
    let slideWidth = testimonials.offsetWidth;

    // Update slide position
    const updateSlide = i => {
        testimonials.style.transition = 'transform 0.6s ease';
        testimonials.style.transform = `translateX(-${i * slideWidth}px)`;
        index = i;
    };

    // Auto slide
    let autoTimer = setInterval(()=>updateSlide((index+1)%total), 4000);

    // Drag
    let isDown=false, startX=0, startTranslate=0;

    const getTranslateX = () => {
        const m = /translateX\((-?\d+(?:\.\d+)?)px\)/.exec(testimonials.style.transform);
        return m ? parseFloat(m[1]) : 0;
    };

    testimonials.addEventListener('pointerdown', e=>{
        isDown=true;
        startX=e.clientX??e.touches?.[0]?.clientX;
        startTranslate=getTranslateX();
        testimonials.style.transition='none';
        clearInterval(autoTimer);
    });

    window.addEventListener('pointermove', e=>{
        if(!isDown) return;
        const x = e.clientX??e.touches?.[0]?.clientX;
        const dx = x-startX;
        testimonials.style.transform = `translateX(${startTranslate + dx}px)`;
    });

    const onEnd = e=>{
        if(!isDown) return;
        isDown=false;
        const x = e.clientX??e.changedTouches?.[0]?.clientX;
        const dx = x-startX;
        if(dx<-slideWidth/4) updateSlide((index+1)%total);
        else if(dx>slideWidth/4) updateSlide((index-1+total)%total);
        else updateSlide(index);

        // Auto slide again
        autoTimer = setInterval(()=>updateSlide((index+1)%total), 4000);
    };

    window.addEventListener('pointerup', onEnd);
    testimonials.addEventListener('touchend', onEnd);

    // Resize support
    window.addEventListener('resize', ()=>{
        slideWidth = testimonials.offsetWidth;
        updateSlide(index);
    });

    // Initial position
    updateSlide(0);

})();


});

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mode-toggle');
    const body = document.body;

    // Apply previous theme
    if (localStorage.getItem('theme') === 'light') {
        toggle.checked = true;
        body.classList.add('light-mode');
    }

    // Apply light mode when changing toggle
    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    });
});

