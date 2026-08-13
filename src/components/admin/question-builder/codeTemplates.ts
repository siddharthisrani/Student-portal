export const CODE_TEMPLATES: Record<string, string> = {
  javascript: `function solve() {

}

solve();`,

  typescript: `function solve(): void {

}

solve();`,

  python: `def solve():

    pass

solve()`,

  java: `public class Main {

    public static void main(String[] args) {

    }

}`,

  cpp: `#include <iostream>

using namespace std;

int main() {

    return 0;

}`,

  csharp: `using System;

class Program {

    static void Main() {

    }

}`,

  php: `<?php

?>`,
};