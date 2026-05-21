const Navigation = {
    ripple: (e) => {
        const btn = e.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;
        const rect = btn.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add("nav-ripple");
        const ripple = btn.getElementsByClassName("nav-ripple")[0];
        if (ripple) ripple.remove();
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 500);
    },
    handlePress: (e, action) => {
        Navigation.ripple(e);
        AppManager.close();
    }
};
