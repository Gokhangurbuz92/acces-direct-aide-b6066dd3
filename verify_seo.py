from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_pages(page: Page):
    # Home
    page.goto("http://localhost:3000/")
    # Wait a bit for React to hydrate/render Helmet
    time.sleep(2)
    expect(page).to_have_title("Accueil - Accès Direct Aide")
    page.screenshot(path="/tmp/home.png")
    print("Home page verified")

    # Accessibilite (Added SEO)
    page.goto("http://localhost:3000/accessibilite")
    time.sleep(1)
    expect(page).to_have_title("Accessibilité - Accès Direct Aide")
    page.screenshot(path="/tmp/accessibilite.png")
    print("Accessibilite page verified")

    # Method (Refactored)
    page.goto("http://localhost:3000/notre-methode")
    time.sleep(1)
    expect(page).to_have_title("Notre Méthode - Accès Direct Aide")
    page.screenshot(path="/tmp/method.png")
    print("Method page verified")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_pages(page)
        finally:
            browser.close()
