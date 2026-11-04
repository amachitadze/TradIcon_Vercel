/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- DOM Element Selectors ---

export const form = document.getElementById('conjugator-form') as HTMLFormElement;
export const input = document.getElementById('verb-input') as HTMLInputElement;
export const button = document.getElementById('submit-button') as HTMLButtonElement;
export const resultsContainer = document.getElementById('results-container') as HTMLElement;
export const modal = document.getElementById('tense-modal') as HTMLElement;
export const modalBody = document.getElementById('modal-body-content') as HTMLElement;
export const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
export const langButtons = document.querySelectorAll('.lang-btn');
export const hamburgerBtn = document.getElementById('hamburger-btn') as HTMLButtonElement;
export const mobileMenu = document.getElementById('mobile-menu') as HTMLElement;
export const mobileMenuOverlay = document.getElementById('mobile-menu-overlay') as HTMLElement;
export const suggestionsContainer = document.getElementById('autocomplete-suggestions') as HTMLElement;
export const navConjugatorBtn = document.getElementById('nav-conjugator') as HTMLButtonElement;
export const navDictionaryBtn = document.getElementById('nav-dictionary') as HTMLButtonElement;
export const navTranslatorBtn = document.getElementById('nav-translator') as HTMLButtonElement;
export const navPracticeBtn = document.getElementById('nav-practice') as HTMLButtonElement;
export const navChatBtn = document.getElementById('nav-chat') as HTMLButtonElement;
export const bottomNavConjugatorBtn = document.getElementById('bottom-nav-conjugator') as HTMLButtonElement;
export const bottomNavDictionaryBtn = document.getElementById('bottom-nav-dictionary') as HTMLButtonElement;
export const bottomNavTranslatorBtn = document.getElementById('bottom-nav-translator') as HTMLButtonElement;

// Modals & File Uploads
export const imageOptionsModal = document.getElementById('image-options-modal') as HTMLElement;
export const imageUploadGalleryInput = document.getElementById('image-upload-gallery') as HTMLInputElement;
export const imageUploadCameraInput = document.getElementById('image-upload-camera') as HTMLInputElement;
export const documentUploadInput = document.getElementById('document-upload-input') as HTMLInputElement;
export const takePhotoBtn = document.getElementById('take-photo-btn') as HTMLButtonElement;
export const fromGalleryBtn = document.getElementById('from-gallery-btn') as HTMLButtonElement;

export const cropperModal = document.getElementById('cropper-modal') as HTMLElement;
export const cropAndTranslateBtn = document.getElementById('crop-and-translate-btn') as HTMLButtonElement;

export const importOptionsModal = document.getElementById('import-options-modal') as HTMLElement;
export const importModalTitle = document.getElementById('import-modal-title') as HTMLElement;
export const importReplaceBtn = document.getElementById('import-replace-btn') as HTMLButtonElement;
export const importReplaceDesc = document.getElementById('import-replace-desc') as HTMLParagraphElement;
export const importMergeBtn = document.getElementById('import-merge-btn') as HTMLButtonElement;
export const importMergeDesc = document.getElementById('import-merge-desc') as HTMLParagraphElement;

export const alertModal = document.getElementById('alert-modal') as HTMLElement;
export const alertModalTitle = document.getElementById('alert-modal-title') as HTMLElement;
export const alertModalBody = document.getElementById('alert-modal-body') as HTMLElement;
export const alertModalCloseBtn = document.getElementById('alert-modal-close-btn') as HTMLElement;

export const confirmModal = document.getElementById('confirm-modal') as HTMLElement;
export const confirmModalTitle = document.getElementById('confirm-modal-title') as HTMLElement;
export const confirmModalBody = document.getElementById('confirm-modal-body') as HTMLElement;
export const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm-btn') as HTMLElement;
export const confirmModalDeclineBtn = document.getElementById('confirm-modal-decline-btn') as HTMLElement;

export const allModalCloseBtns = document.querySelectorAll('.modal-close');
export const allModalOverlays = document.querySelectorAll('.modal-overlay');

// Fullscreen Overlay
export const fullscreenOverlay = document.getElementById('fullscreen-translation-overlay') as HTMLElement;
export const fullscreenTextContainer = document.getElementById('fullscreen-text-container') as HTMLElement;
export const fullscreenCloseBtn = document.getElementById('fullscreen-close-btn') as HTMLButtonElement;
export const fullscreenSpeakBtn = document.getElementById('fullscreen-speak-btn') as HTMLButtonElement;
export const fullscreenSettingsBtn = document.getElementById('fullscreen-settings-btn') as HTMLButtonElement;
export const fullscreenSettingsPanel = document.getElementById('fullscreen-settings-panel') as HTMLElement;

// Fullscreen Settings Panel Controls
export const fsFontSizeValue = document.getElementById('fs-font-size-value') as HTMLSpanElement;
export const fsFontSizeDecreaseBtn = document.getElementById('fs-font-size-decrease-btn') as HTMLButtonElement;
export const fsFontSizeIncreaseBtn = document.getElementById('fs-font-size-increase-btn') as HTMLButtonElement;
export const fsFontSizeSlider = document.getElementById('fs-font-size-slider') as HTMLInputElement;
export const fsThemeBtns = document.querySelectorAll('.fs-theme-btn');
export const fsRotateScreenBtn = document.getElementById('fs-rotate-screen-btn') as HTMLButtonElement;


// Footer
export const footerMaterialsLink = document.getElementById('footer-materials-link') as HTMLAnchorElement;
export const footerAboutBtn = document.getElementById('footer-about-btn') as HTMLButtonElement;