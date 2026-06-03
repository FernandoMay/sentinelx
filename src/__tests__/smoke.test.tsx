import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Smoke test", () => {
  it("renders a button", () => {
    render(<Button>Hello</Button>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
