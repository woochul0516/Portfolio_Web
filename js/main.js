/**
 * Main JavaScript File
 * ES6+ 문법 활용 및 바닐라 JS 기반 상태 관리 패턴 구현
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 0. EmailJS 서비스 초기화 (본인의 Public Key를 입력하세요)
  // -------------------------------------------------------------
  const EMAILJS_PUBLIC_KEY = 'Y8ShiAGTPQfo1BJUj'; // EmailJS에서 발급받은 Public Key
  const EMAILJS_SERVICE_ID = 'service_gnviycc'; // EmailJS Service ID
  const EMAILJS_TEMPLATE_ID = 'template_izxcc11'; // EmailJS Template ID

  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // -------------------------------------------------------------
  // 1. 상태 객체 (State Management)
  // -------------------------------------------------------------
  const state = {
    theme: localStorage.getItem('theme') || 'light',
    repos: [],
    filter: 'all',
    loading: false,
    error: null,
    formErrors: {}
  };

  // GitHub 사용자 ID 설정
  const GITHUB_USERNAME = 'woochul0516';

  // -------------------------------------------------------------
  // 2. DOM 요소 선택 (DOM Elements)
  // -------------------------------------------------------------
  const header = document.querySelector('#header');
  const themeToggleBtn = document.querySelector('#theme-toggle');
  const hamburgerBtn = document.querySelector('#hamburger');
  const navMenu = document.querySelector('#nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollTopBtn = document.querySelector('#scroll-top');
  const projectsContainer = document.querySelector('#projects-container');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const contactForm = document.querySelector('#contact-form');
  const typingElement = document.querySelector('#typing-text');

  // -------------------------------------------------------------
  // 3. 인터랙션 및 상태 변경 함수들
  // -------------------------------------------------------------

  // [상태 1] 다크 모드 관리 (이벤트 -> 상태 변경 -> DOM/Storage 반영)
  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  };

  const toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  };

  const updateThemeIcon = () => {
    const icon = themeToggleBtn.querySelector('i');
    if (state.theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  };

  // [상태 2] GitHub API 연동 및 상태별 렌더링 (로딩/성공/에러/빈값)
  const fetchGitHubRepos = async () => {
    state.loading = true;
    state.error = null;
    renderProjects(); // 로딩 상태 렌더링

    try {
      const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API 요청 제한 횟수를 초과했습니다 (403).');
        }
        throw new Error('프로젝트 데이터를 불러오지 못했습니다.');
      }

      const data = await response.json();
      state.repos = data;
      state.loading = false;
      renderProjects(); // 성공 상태 렌더링
    } catch (err) {
      state.loading = false;
      state.error = err.message;
      renderProjects(); // 에러 상태 렌더링
    }
  };

  const renderProjects = () => {
    // 1. 로딩 상태 UI
    if (state.loading) {
      projectsContainer.innerHTML = `
        <div class="state-container">
          <div class="spinner"></div>
          <p>GitHub 프로젝트 불러오는 중...</p>
        </div>
      `;
      return;
    }

    // 2. 에러 상태 UI
    if (state.error) {
      projectsContainer.innerHTML = `
        <div class="state-container">
          <p class="error-msg">${state.error}</p>
          <button id="retry-btn" class="btn btn-primary" style="margin-top:10px;">다시 시도</button>
        </div>
      `;
      document.querySelector('#retry-btn')?.addEventListener('click', fetchGitHubRepos);
      return;
    }

    // 필터링 적용 (array.filter 사용)
    const filteredRepos = state.repos.filter(repo => {
      if (state.filter === 'all') return true;
      return repo.language === state.filter;
    });

    // 3. 빈 데이터 상태 UI
    if (filteredRepos.length === 0) {
      projectsContainer.innerHTML = `
        <div class="state-container">
          <p>표시할 프로젝트가 없습니다.</p>
        </div>
      `;
      return;
    }

    // 4. 성공 상태 UI (array.map + 구조분해할당 + 템플릿 리터럴)
    projectsContainer.innerHTML = filteredRepos.map(repo => {
      const { name, description, html_url, stargazers_count, language } = repo;
      return `
        <article class="project-card">
          <div>
            <h3 class="project-title">${name}</h3>
            <p class="project-desc">${description || '설명이 없습니다.'}</p>
          </div>
          <div>
            <div class="project-meta">
              <span><i class="fa-solid fa-code"></i> ${language || 'N/A'}</span>
              <span><i class="fa-solid fa-star"></i> ${stargazers_count}</span>
            </div>
            <a href="${html_url}" target="_blank" class="btn btn-outline" style="width:100%; text-align:center;">GitHub 이동</a>
          </div>
        </article>
      `;
    }).join('');
  };

  // [상태 3] Contact Form 유효성 검사
  const validateForm = (data) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.username.trim()) {
      errors.username = '이름을 입력해주세요.';
    }

    if (!data.email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!emailRegex.test(data.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!data.message.trim()) {
      errors.message = '메시지를 입력해주세요.';
    }

    return errors;
  };

  const renderFormErrors = (errors) => {
    document.querySelector('#name-error').textContent = errors.username || '';
    document.querySelector('#email-error').textContent = errors.email || '';
    document.querySelector('#message-error').textContent = errors.message || '';
  };

  // 타이핑 효과 (보너스 구현)
  const initTypingEffect = () => {
    const text = 'Jung Woochul';
    let index = 0;
    
    const type = () => {
      if (index < text.length) {
        typingElement.textContent += text.charAt(index);
        index++;
        setTimeout(type, 150);
      }
    };
    type();
  };

  // 스크롤 애니메이션 (Intersection Observer)
  const initScrollAnimation = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });
  };

  // -------------------------------------------------------------
  // 4. 이벤트 리스너 바인딩 (addEventListener)
  // -------------------------------------------------------------

  // 다크 모드 버튼 클릭
  themeToggleBtn.addEventListener('click', toggleTheme);

  // 햄버거 메뉴 토글 (모바일)
  hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // 메뉴 링크 클릭 시 메뉴 닫기
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });

  // 스크롤 이벤트 (헤더 변화 및 Top 버튼)
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('show');
    } else {
      scrollTopBtn.classList.remove('show');
    }
  });

  // 스크롤 탑 이동
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 프로젝트 언어 필터링 클릭 (array.forEach + 이벤트 처리)
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      state.filter = e.target.dataset.filter;
      renderProjects();
    });
  });

  // 폼 제출 이벤트 (EmailJS 실제 전송 적용)
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
      username: contactForm.username.value,
      email: contactForm.email.value,
      message: contactForm.message.value
    };

    const errors = validateForm(formData);
    state.formErrors = errors;
    renderFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const submitBtn = contactForm.querySelector('.btn-submit');
      const successMsg = document.querySelector('#form-success');
      
      // 전송 중 상태 표시
      submitBtn.disabled = true;
      submitBtn.textContent = '전송 중...';

      // EmailJS 설정을 적용하여 실제 이메일 발송
      if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          name: formData.username,    // 템플릿의 {{name}}에 전달
          email: formData.email,      // 템플릿의 {{email}}에 전달
          message: formData.message   // 템플릿의 {{message}}에 전달
        }).then(() => {
          successMsg.textContent = '성공적으로 메시지가 전송되었습니다!';
          contactForm.reset();
        }).catch((err) => {
          console.error('EmailJS Error:', err);
          successMsg.textContent = '메시지 전송에 실패했습니다. 나중에 다시 시도해주세요.';
        }).finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = '보내기';
          setTimeout(() => {
            successMsg.textContent = '';
          }, 3000);
        });
      } else {
        // EmailJS 키를 아직 설정하지 않은 경우 (시뮬레이션 동작)
        setTimeout(() => {
          successMsg.textContent = '성공적으로 메시지가 전송되었습니다! (EmailJS 키 설정 필요)';
          contactForm.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = '보내기';
          
          setTimeout(() => {
            successMsg.textContent = '';
          }, 3000);
        }, 1000);
      }
    }
  });

  // -------------------------------------------------------------
  // 5. 초기화 실행
  // -------------------------------------------------------------
  initTheme();
  initTypingEffect();
  initScrollAnimation();
  fetchGitHubRepos();
});