// File: src/app.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should render the landing page markup', () => {
      const html = appController.getLandingPage();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Songbird API');
      expect(html).toContain('/openapi.yaml');
    });
  });
});
